"""Export and independently check the pinned checkpoint. No patient data required."""
import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import torch
from squeezevit import SqueezeViT


def rollout(layers):
    identity = torch.eye(49, device=layers[0].device).unsqueeze(0)
    joint = identity.expand(layers[0].shape[0], -1, -1)
    for weights in layers:
        residual = weights + identity
        residual = residual / residual.sum(-1, keepdim=True)
        joint = residual @ joint
    received = joint.mean(1)
    low = received.amin(1, keepdim=True)
    span = received.amax(1, keepdim=True) - low
    safe_span = torch.where(span > 0, span, torch.ones_like(span))
    return ((received - low) / safe_span).reshape(-1, 1, 7, 7)


class ExportModel(SqueezeViT):
    def forward(self, image):
        logits = super().forward(image)
        attention = rollout([block.last_attention for block in self.stage2.transformers])
        return logits, attention


def assert_parity(actual, expected):
    absolute = np.max(np.abs(actual - expected))
    relative = np.max(np.abs(actual - expected) / np.maximum(np.abs(expected), 1e-12))
    if absolute > 1e-4 or relative > 1e-3:
        raise ValueError(f"Logits parity failed: abs={absolute}, rel={relative}")
    return {"maxAbsoluteLogitError": float(absolute), "maxRelativeLogitError": float(relative)}


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
        logits, attention = model(sample)
        assert_parity(logits.numpy(), reference(sample).numpy())
        assert_parity(logits.numpy().flatten(), np.array(json.loads(args.baseline_logits.read_text())))
        assert torch.equal(attention, model(sample)[1]), "Attention is not deterministic"
    args.output.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(model, sample, str(args.output), input_names=["input"], output_names=["logits", "attention_map"],
                      dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}, "attention_map": {0: "batch"}},
                      opset_version=17, dynamo=False, external_data=False)
    onnx.checker.check_model(onnx.load(args.output), full_check=True)
    session = ort.InferenceSession(str(args.output), providers=["CPUExecutionProvider"])
    actual_logits, actual_attention = session.run(None, {"input": sample.numpy()})
    errors = assert_parity(actual_logits, logits.numpy())
    np.testing.assert_allclose(actual_attention, attention.numpy(), atol=1e-4, rtol=0)
    assert actual_attention.shape == (1, 1, 7, 7)
    assert np.isfinite(actual_attention).all() and actual_attention.min() >= 0 and actual_attention.max() <= 1
    fixtures = args.output.parent / "fixtures"
    fixtures.mkdir(exist_ok=True)
    # Attention evidence is PyTorch output, not the ONNX output being tested.
    data = json.dumps(attention.flatten().tolist(), separators=(",", ":"))
    (fixtures / "expected-attention.json").write_text(data)
    evidence = {**errors, "checkpointSha256": hashlib.sha256(args.checkpoint.read_bytes()).hexdigest(),
                "modelSha256": hashlib.sha256(args.output.read_bytes()).hexdigest(),
                "exporterSha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
                "architectureSha256": hashlib.sha256(Path(__file__).with_name("squeezevit.py").read_bytes()).hexdigest(),
                "attentionFixtureSha256": hashlib.sha256(data.encode()).hexdigest(), "onnxCheckerPassed": True,
                "deterministic": True, "torchVersion": torch.__version__, "onnxVersion": onnx.__version__}
    (args.output.parent / "export-validation.json").write_text(json.dumps(evidence, indent=2))
    print(json.dumps(evidence, indent=2))


if __name__ == "__main__":
    main()
