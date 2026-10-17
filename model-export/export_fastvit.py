"""Export a FastViT-SA12 checkpoint as a V2 bundle (logits + attention_map). No patient data required.

The trained (unfused) model is the reference: its fixture logits become expected-logits.json, and the
reparameterized export must match them before and after ONNX conversion.
"""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import timm
import torch
from timm.utils.model import reparameterize_model

from export_squeezevit import assert_parity, rollout
from fastvit_thoraxscan import FastViTThoraxScan, attention_modules


class ExportModel(torch.nn.Module):
    """Reparameterized FastViT that also returns rollout over its global (stage 4, 7x7) attention blocks."""

    def __init__(self, trained):
        super().__init__()
        self.model = reparameterize_model(trained)
        self.layers = []
        for block in attention_modules(self.model):
            block.fused_attn = False  # explicit softmax path so the weights can be read
            block.attn_drop.register_forward_hook(lambda _m, _i, weights: self.layers.append(weights.mean(1)))

    def forward(self, image):
        self.layers.clear()
        logits = self.model(image)
        return logits, rollout(self.layers)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--checkpoint", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fixture-input", type=Path, required=True)
    args = parser.parse_args()
    torch.manual_seed(0)
    torch.set_num_threads(1)
    state = torch.load(args.checkpoint, map_location="cpu", weights_only=True)
    trained = FastViTThoraxScan(pretrained=False).eval()
    trained.load_state_dict(state.get("model_state_dict", state))
    model = ExportModel(trained).eval()
    sample = torch.from_numpy(np.fromfile(args.fixture_input, dtype="<f4").reshape(1, 1, 224, 224))
    with torch.no_grad():
        reference = trained(sample)
        logits, attention = model(sample)
        assert len(model.layers) == 2, f"Expected 2 global attention blocks, found {len(model.layers)}"
        assert_parity(logits.numpy(), reference.numpy())
        assert torch.equal(attention, model(sample)[1]), "Attention is not deterministic"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, sample, str(args.output), input_names=["input"], output_names=["logits", "attention_map"],
                      dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}, "attention_map": {0: "batch"}},
                      opset_version=17, dynamo=False, external_data=False)
    onnx.checker.check_model(onnx.load(args.output), full_check=True)
    session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
    actual_logits, actual_attention = session.run(None, {"input": sample.numpy()})
    errors = assert_parity(actual_logits, reference.numpy())
    np.testing.assert_allclose(actual_attention, attention.numpy(), atol=1e-4, rtol=0)
    assert actual_attention.shape == (1, 1, 7, 7)
    assert np.isfinite(actual_attention).all() and actual_attention.min() >= 0 and actual_attention.max() <= 1
    fixtures = args.output.parent / "fixtures"
    fixtures.mkdir(exist_ok=True)
    # Expected outputs are PyTorch evidence from the trained model, not the ONNX output being tested.
    (fixtures / "expected-logits.json").write_text(json.dumps(reference.flatten().tolist(), indent=2))
    (fixtures / "expected-probabilities.json").write_text(json.dumps(torch.sigmoid(reference).flatten().tolist(), indent=2))
    data = json.dumps(attention.flatten().tolist(), separators=(",", ":"))
    (fixtures / "expected-attention.json").write_text(data)
    evidence = {**errors, "checkpointSha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
                "modelSha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                "exporterSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                "architectureSha256": hashlib.sha256(Path(__file__).with_name("fastvit_thoraxscan.py").read_bytes()).hexdigest(),
                "attentionFixtureSha256": hashlib.sha256(data.encode()).hexdigest(), "onnxCheckerPassed": True,
                "deterministic": True, "torchVersion": torch.__version__, "onnxVersion": onnx.__version__,
                "timmVersion": timm.__version__}
    (args.output.parent / "export-validation.json").write_text(json.dumps(evidence, indent=2))
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
