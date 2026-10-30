"""Export a TinyViT-11M checkpoint with per-label class activation maps (contract V3). No patient data required."""
import argparse
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import timm
import torch
import torch.nn as nn
import torch.nn.functional as F
from export_squeezevit import assert_parity
from export_squeezevit_cam import class_activation
from tinyvit_thoraxscan import TinyViTThoraxScan

CAM_GRID = 14  # contract V3 grid; TinyViT's last stage is 7x7 at 224
ECM, CARDIOMEGALY = 1, 2  # contract label order: Enlarged Cardiomediastinum, Cardiomegaly


def centred_features(backbone, features):
    """Per-cell features after the head's LayerNorm statistics, so the fc weights give an exact CAM.

    TinyViT's head is avg pool -> LayerNorm -> fc. The LayerNorm mean and scale are per-image scalars, so applying
    them (and the LayerNorm weight) to every cell keeps mean(raw map) + fc(LayerNorm bias) + fc bias == logit.
    """
    norm = backbone.head.norm
    pooled = features.mean((2, 3), keepdim=True)
    mean = pooled.mean(1, keepdim=True)
    scale = torch.sqrt(pooled.var(1, unbiased=False, keepdim=True) + norm.eps)
    return (features - mean) / scale * norm.weight.view(1, -1, 1, 1)


def ecm_rule(logits, offset):
    """Raise the Enlarged Cardiomediastinum logit to Cardiomegaly's, shifted by offset.

    CheXpert's label hierarchy puts Cardiomegaly under Enlarged Cardiomediastinum: an enlarged heart enlarges the
    cardiomediastinal silhouette. With offset = logit(ECM threshold) - logit(Cardiomegaly threshold), ECM crosses its
    threshold exactly when ECM or Cardiomegaly crosses its own. Returns the new logits and where the rule decided ECM.
    """
    implied = logits[:, CARDIOMEGALY] + offset
    ecm = torch.maximum(logits[:, ECM], implied)
    return torch.cat([logits[:, :ECM], ecm[:, None], logits[:, ECM + 1:]], 1), implied > logits[:, ECM]


def logit(probability):
    return math.log(probability / (1 - probability))


class ExportModel(nn.Module):
    def __init__(self, trained, ecm_offset=None):
        super().__init__()
        self.trained = trained
        self.ecm_offset = ecm_offset

    def forward(self, image):
        backbone = self.trained.backbone
        features = backbone.forward_features(self.trained.to_imagenet(image))
        logits = backbone.forward_head(features)
        # Bilinear upsampling is linear, so upsampling before the fc weights equals upsampling the 7x7 raw maps.
        cells = F.interpolate(centred_features(backbone, features), size=(CAM_GRID, CAM_GRID), mode="bilinear",
                              align_corners=False)
        cam = class_activation(cells, backbone.head.fc.weight)
        if self.ecm_offset is None:
            return logits, cam
        logits, implied = ecm_rule(logits, self.ecm_offset)
        # Where Cardiomegaly decided ECM, ECM's heatmap is the Cardiomegaly evidence that flagged it.
        ecm_map = torch.where(implied[:, None, None, None], cam[:, CARDIOMEGALY:CARDIOMEGALY + 1], cam[:, ECM:ECM + 1])
        return logits, torch.cat([cam[:, :ECM], ecm_map, cam[:, ECM + 1:]], 1)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fixture-input", type=Path, required=True)
    parser.add_argument("--ecm-rule-thresholds", type=Path,
                        help="release thresholds.json: also flag Enlarged Cardiomediastinum whenever Cardiomegaly is flagged")
    args = parser.parse_args()
    torch.manual_seed(0)
    torch.set_num_threads(1)
    state = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    trained = TinyViTThoraxScan(pretrained=False).eval()
    trained.load_state_dict(state.get("model_state_dict", state))
    thresholds = json.loads(args.ecm_rule_thresholds.read_text()) if args.ecm_rule_thresholds else None
    ecm_offset = thresholds and logit(thresholds["Enlarged Cardiomediastinum"]) - logit(thresholds["Cardiomegaly"])
    model = ExportModel(trained, ecm_offset).eval()
    sample = torch.from_numpy(np.fromfile(args.fixture_input, dtype="<f4").reshape(1, 1, 224, 224))
    with torch.no_grad():
        reference = trained(sample)
        if ecm_offset is not None:
            reference = ecm_rule(reference, ecm_offset)[0]
        logits, cam = model(sample)
        assert_parity(logits.numpy(), reference.numpy())
        assert torch.equal(cam, model(sample)[1]), "Class activation is not deterministic"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, sample, str(args.output), input_names=["input"], output_names=["logits", "class_activation"],
                      dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}, "class_activation": {0: "batch"}},
                      opset_version=17, dynamo=False, external_data=False)
    onnx.checker.check_model(onnx.load(args.output), full_check=True)
    session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
    actual_logits, actual_cam = session.run(None, {"input": sample.numpy()})
    errors = assert_parity(actual_logits, reference.numpy())
    np.testing.assert_allclose(actual_cam, cam.numpy(), atol=1e-4, rtol=0)
    assert actual_cam.shape == (1, 14, CAM_GRID, CAM_GRID)
    assert np.isfinite(actual_cam).all() and actual_cam.min() >= 0 and actual_cam.max() <= 1
    fixtures = args.output.parent / "fixtures"
    fixtures.mkdir(exist_ok=True)
    # Expected outputs are PyTorch evidence from the trained model (plus the ECM rule), not the ONNX output being tested.
    (fixtures / "expected-logits.json").write_text(json.dumps(reference.flatten().tolist(), indent=2))
    (fixtures / "expected-probabilities.json").write_text(json.dumps(torch.sigmoid(reference).flatten().tolist(), indent=2))
    data = json.dumps(cam.flatten().tolist(), separators=(",", ":"))
    (fixtures / "expected-class-activation.json").write_text(data)
    evidence = {**errors, "checkpointSha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
                "modelSha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                "exporterSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                "architectureSha256": hashlib.sha256(Path(__file__).with_name("tinyvit_thoraxscan.py").read_bytes()).hexdigest(),
                "classActivationFixtureSha256": hashlib.sha256(data.encode()).hexdigest(), "onnxCheckerPassed": True,
                "deterministic": True, "torchVersion": torch.__version__, "onnxVersion": onnx.__version__,
                "timmVersion": timm.__version__, "ecmRuleOffset": ecm_offset}
    (args.output.parent / "export-validation.json").write_text(json.dumps(evidence, indent=2))
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
