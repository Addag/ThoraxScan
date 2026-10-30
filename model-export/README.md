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

## FastViT-SA12 (retrain v3)

`export_fastvit.py` reparameterizes the trained `fastvit_thoraxscan.py` model and
rolls out its two stage-4 global attention blocks (7x7 tokens, heads averaged) with
the same `rollout` as above. The trained, unfused model is the reference: the
exporter writes its fixture logits and probabilities, and checks the reparameterized
PyTorch and ONNX outputs against them. Copy the synthetic preprocessing fixtures and
`preprocessing-reference.py` from an earlier bundle, plus the run's `thresholds.json`.

```powershell
python model-export/export_fastvit.py `
  --checkpoint "<training-directory>/Official_retrain_v3_fastvit/checkpoints/fastvit_v3_best.pth" `
  --output "model-input/<release-id>/model.onnx" `
  --fixture-input "model-input/<release-id>/fixtures/model-input.f32"
npm run model:validate -- --bundle "model-input/<release-id>"
```

## Per-finding class activation maps (contract V3)

`export_squeezevit_cam.py` exports a SqueezeViT checkpoint with unchanged logits
and `class_activation`, float32[batch,14,14,14]: the `fc` weights for each label
applied to the 256×14×14 `head_conv` features (exact CAM, because the head is a
plain average pool), negative values clipped and each label scaled to its own
maximum. `export_squeezevit.py` is left unchanged so V2 exporter evidence still
matches. Copy the synthetic fixtures, thresholds and preprocessing reference from
the source bundle; the exporter writes `fixtures/expected-class-activation.json`
and `export-validation.json`.

```powershell
python model-export/export_squeezevit_cam.py `
  --checkpoint "<training-directory>/Official_retrain_v5_squeezevit_kd/checkpoints/squeezevit_v5_best.pth" `
  --output "model-input/<release-id>/model.onnx" `
  --fixture-input "model-input/<release-id>/fixtures/model-input.f32" `
  --baseline-logits "model-input/<release-id>/fixtures/expected-logits.json"
npm run model:validate -- --bundle "model-input/<release-id>"
```

`test_cam.py` checks the CAM identity (`mean(raw map) + bias = logits`) and the
normalization.

`export_tinyvit_cam.py` does the same for TinyViT-11M (`tinyvit_thoraxscan.py`).
Its head is avg pool → LayerNorm → fc, so each cell gets the head's per-image
LayerNorm mean and scale before the fc weights (still exact). The 7×7 features
are bilinearly upsampled to the contract's 14×14 grid. It writes the fixture
logits and probabilities from the trained model, like the FastViT exporter; copy
only the synthetic preprocessing fixtures, thresholds and preprocessing reference.

```powershell
python model-export/export_tinyvit_cam.py `
  --checkpoint "<training-directory>/Official_retrain_v7_tinyvit/checkpoints/tinyvit_v7_best.pth" `
  --output "model-input/<release-id>/model.onnx" `
  --fixture-input "model-input/<release-id>/fixtures/model-input.f32"
npm run model:validate -- --bundle "model-input/<release-id>"
```

`--ecm-rule-thresholds <bundle>/thresholds.json` also flags Enlarged Cardiomediastinum whenever
Cardiomegaly is flagged (CheXpert's label hierarchy) by raising the ECM logit inside the graph; the fixture
logits include the rule and ECM shows the Cardiomegaly map where the rule decides.

`eval_localization.py --arch tinyvit` scores its maps in the NIH pointing game.

Never commit checkpoints, patient images or generated artifacts.
See [release operations](../docs/model-releases.md) for authorization and rollback.
