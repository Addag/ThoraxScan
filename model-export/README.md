# Attention V2 export

Exports the official best checkpoint with unchanged 14 logits and global,
class-agnostic attention. Four head-averaged attention matrices receive identity
and row normalization. Later layers multiply on the left; query averaging and
per-image min-max normalization produce float32[batch,1,7,7]. Constant maps are zeros.

Use Python with requirements.txt (verified with torch 2.11.0+cu128 on CPU).
Copy the existing V1 synthetic fixtures and thresholds into a new ignored bundle;
do not replace baseline logits with V2 outputs. Give release.json a new immutable
release ID and the official checkpoint checksum.

```powershell
python -m pip install -r model-export/requirements.txt
python model-export/export_squeezevit.py `
  --checkpoint "<training-directory>/Official_retrain_v1/checkpoints/squeezevit_official_best.pth" `
  --output "model-input/<release-id>/model.onnx" `
  --fixture-input "model-input/<release-id>/fixtures/model-input.f32" `
  --baseline-logits "model-input/<release-id>/fixtures/expected-logits.json"
python -m unittest discover -s model-export -p "test_*.py"
npm run model:validate -- --bundle "model-input/<release-id>"
```

The exporter checks logits against the pinned architecture and V1 fixture, runs
ONNX's full checker and CPU parity, and writes the PyTorch attention fixture and
export-validation.json. Evidence records checkpoint, ONNX, exporter, architecture
and attention fixture hashes. Release validation rejects mismatched artifact,
fixture or checkpoint evidence, checks preprocessing and repeated WASM inference,
and measures browser providers. WebGPU remains disabled unless logits and attention
both pass provider parity. Review the generated 49 values before staging.

Never commit checkpoints, patient images or generated artifacts.
See [release operations](../docs/model-releases.md) for authorization and rollback.
