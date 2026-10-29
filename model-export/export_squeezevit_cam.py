"""Export a SqueezeViT checkpoint with per-label class activation maps (contract V3). No patient data required."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from export_squeezevit import assert_parity
from squeezevit import SqueezeViT


def class_activation(features, weight):
    # CAM: fc weights over the pre-pool head features. mean(raw[:, c]) + bias[c] equals logit c.
    raw = torch.einsum("ck,bkhw->bchw", weight, features)
    positive = raw.clamp(min=0)
    peak = positive.amax((2, 3), keepdim=True)
    # The final clamp absorbs a one-ulp overshoot from WebGPU's division so every provider stays within [0, 1].
    return (positive / torch.where(peak > 0, peak, torch.ones_like(peak))).clamp(max=1)


class ExportModel(SqueezeViT):
    def forward(self, image):
        features = self.head_conv(self.stage3(self.stage2(self.stage1(self.stem(image)))))
        logits = self.fc(self.pool(features).flatten(1))
        return logits, class_activation(features, self.fc.weight)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fixture-input", type=Path, required=True)
    parser.add_argument("--baseline-logits", type=Path, required=True)
    args = parser.parse_args()
    torch.manual_seed(0)
    torch.set_num_threads(1)
    torch.backends.mha.set_fastpath_enabled(False)
    state = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    model = ExportModel().eval()
    model.load_state_dict(state.get("model_state_dict", state))
    reference = SqueezeViT().eval()
    reference.load_state_dict(model.state_dict())
    sample = torch.from_numpy(np.fromfile(args.fixture_input, dtype="<f4").reshape(1, 1, 224, 224))
    with torch.no_grad():
        logits, cam = model(sample)
        assert_parity(logits.numpy(), reference(sample).numpy())
        assert_parity(logits.numpy().flatten(), np.array(json.loads(args.baseline_logits.read_text())))
        assert torch.equal(cam, model(sample)[1]), "Class activation is not deterministic"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, sample, str(args.output), input_names=["input"], output_names=["logits", "class_activation"],
                      dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}, "class_activation": {0: "batch"}},
                      opset_version=17, dynamo=False, external_data=False)
    onnx.checker.check_model(onnx.load(args.output), full_check=True)
    session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
    actual_logits, actual_cam = session.run(None, {"input": sample.numpy()})
    errors = assert_parity(actual_logits, logits.numpy())
    np.testing.assert_allclose(actual_cam, cam.numpy(), atol=1e-4, rtol=0)
    assert actual_cam.shape == (1, 14, 14, 14)
    assert np.isfinite(actual_cam).all() and actual_cam.min() >= 0 and actual_cam.max() <= 1
    fixtures = args.output.parent / "fixtures"
    fixtures.mkdir(exist_ok=True)
    # Class activation evidence is PyTorch output, not the ONNX output being tested.
    data = json.dumps(cam.flatten().tolist(), separators=(",", ":"))
    (fixtures / "expected-class-activation.json").write_text(data)
    evidence = {**errors, "checkpointSha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
                "modelSha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                "exporterSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                "architectureSha256": hashlib.sha256(Path(__file__).with_name("squeezevit.py").read_bytes()).hexdigest(),
                "classActivationFixtureSha256": hashlib.sha256(data.encode()).hexdigest(), "onnxCheckerPassed": True,
                "deterministic": True, "torchVersion": torch.__version__, "onnxVersion": onnx.__version__}
    (args.output.parent / "export-validation.json").write_text(json.dumps(evidence, indent=2))
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
