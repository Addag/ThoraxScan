---
node_type: object
universe: live
status: verified
audited: 2026-09-29
snapshot: external training folder (not in this repo), files dated 2026-09-15; script edited 2026-09-23
---

# Model training (official retrain v1)

The PyTorch run that produced the one checkpoint behind both the V1 and V2 [model releases](model-release.md). It lives outside this repository, in the owner's `ViT_Models/Official_retrain_v1/` folder. The dataset is the local `cheXpert-v1.0-small` copy.

## Shape

| Item | Value |
|---|---|
| Script | `train_official.py` (model `squeezevit_thoraxScan.py`, preprocessing `preprocessing_v1.py`) |
| Training data | `train.csv`, **all 223,414 rows: 191,027 frontal + 32,387 lateral (14.5%)**; no view filter |
| Validation during training | `valid.csv`, **all 234 rows: 202 frontal + 32 lateral** |
| Labels | 14 CheXpert labels, fixed order; uncertainty policy `u-zero` (-1 and blank → 0) |
| Loss | `BCEWithLogitsLoss` with per-label `pos_weight = neg/pos`, capped at 10 |
| Optimizer | AdamW, lr 1e-4, weight decay 0.01, no scheduler; fp16 autocast on CUDA |
| Batch / epochs / seed | 128 / 50 / 20260908, deterministic cuDNN |
| Checkpoint selection | best mean AUC over the 5 competition labels (Cardiomegaly, Edema, Consolidation, Atelectasis, Pleural Effusion) → **epoch 10** |
| Preprocessing | `browser-contract-v1-bilinear-center-rec601`: Rec. 601 grayscale, center-aligned bilinear 224×224 without antialiasing, (x−0.5)/0.25. Mirrors the browser [preprocessing tensor](preprocessing-tensor.md) |
| Checkpoint | `checkpoints/squeezevit_official_best.pth`, SHA-256 `c7f1a4ad…e055145` |
| V1 export | `export_onnx.py`: opset 17, `dynamo=False` → `artifacts/squeezevit_official_best.onnx` (`d7464807…07941`) |
| V2 export | same checkpoint through [model-export/](../../../model-export/README.md), which adds `attention_map` |
| Environment | torch 2.11.0+cu128, onnx 1.21.0, onnxruntime-gpu 1.26.0 (`requirements-lock.txt`) |
| Input hashes | `train.csv` `b4bcd3d7…`, `valid.csv` `aa43403f…`, model source `90e31cc9…` (`run-config.json`) |

## Evidence for the view scope

- Neither the training script nor its 2026-09-15 compiled copy (`__pycache__/train_official.cpython-314.pyc`) filters by view.
- Recomputing the checkpoint on `valid.csv` gives these values (checked 2026-09-29):

  | Images | All-label mean AUC | Competition AUC |
  |---|---|---|
  | Recorded in the checkpoint | 0.74008 | 0.84070 |
  | All 234 | 0.74008 | 0.84073 |
  | Frontal 202 | 0.75500 | 0.83767 |

  The recorded values match all 234 images, so validation during training included the lateral images.
- The checkpoint fields `train_rows: 191027` and `valid_rows: 202` are hand-typed constants, not counts, and they are wrong. They equal the frontal counts only.

## Reported results

- `results/squeezevit_official_per_label_auc.csv` comes from `evaluate_official.py`, which **does** filter to the 202 frontal images. Fracture is skipped there because it has no positive cases.
- The 32 lateral images alone give a competition AUC of 0.861, but that is too few images for a per-label result. Lateral support is therefore **unevaluated**, even though laterals were in training.
- These results differ from the older `custom_train_squeezevit_b128_e38` run described in the frozen [capstone record](../../CAPSTONE_CURRENT_STATE.md) (frontal-only `train_custom.csv` with 171,821 rows and `valid_custom.csv` with 19,206 rows). Do not mix the two runs.
- `make_chexpert_custom_split.py --all-views` writes `train_custom_all_views.csv` (200,992 rows: 171,821 frontal + 29,171 lateral) and `valid_custom_all_views.csv` (22,422 rows: 19,206 frontal + 3,216 lateral). It uses the same validation patients as the frontal-only custom split, whose frontal rows are identical. No checkpoint has been trained on it yet (2026-10-01).
- `ViT_Models/Official_retrain_v2/` (2026-10-13; smoke-tested, not yet trained) uses the same model and preprocessing on the all-views split. It adds augmentation (no horizontal flip), warmup + cosine LR (peak 3e-4), EMA weights saved as `model_state_dict`, and selection on the held-out split logged per view. `tune_thresholds.py` writes per-label F1 thresholds to `thresholds.json`, and `evaluate.py` reports AUC and thresholded metrics per view on the official 234.
- v2 trained 2026-10-13: best epoch 26 of 30 (EMA), checkpoint SHA-256 `e8536d8b…bf6c99`.
  - Held-out competition AUC: 0.7935 overall, 0.789 frontal, 0.797 lateral (3,216 images).
  - Official 234: competition 0.8589 and mean 0.7677 overall; competition 0.8572 and mean 0.7724 on the 202 frontal (v1: 0.8407 and 0.7401 overall; 0.8377 and 0.7550 frontal).
  - v3 candidate `ViT_Models/Official_retrain_v3_fastvit/` (2026-10-15): timm FastViT-SA12, ImageNet-pretrained, 10.57M params, v2 recipe at peak LR 1e-4. Best epoch 5 of 30; held-out AUC falls after epoch 5 (overfitting).
    - Held-out: competition 0.8092 and mean 0.8025 (v2: 0.7935 and 0.7791); higher on all 14 labels.
    - Official 234: competition 0.8583 vs 0.8589 (paired-bootstrap 95% CI −0.015 to +0.014); stable-label mean 0.8263 vs 0.8113.
    - Not exported: it needs a new exporter for the attention map, and it has not been tested in the browser (2026-10-17).
  - v4 rerun `ViT_Models/Official_retrain_v4_fastvit/` (set up 2026-10-17; smoke-tested, not yet trained): v3 plus 8 epochs, drop-path 0.1, and a per-label uncertainty policy for training only. Uncertain Atelectasis and Edema count as positive, uncertain Cardiomegaly is left out of the loss, and other uncertain labels count as negative. Selection and evaluation stay on u-zero labels.
    - Trained 2026-10-17: best epoch 6 of 8, plateau from epoch 5 (overfitting fixed).
    - Held-out competition 0.8041 (below v3's 0.8092, because the u-zero held-out labels count uncertain Atelectasis/Edema as negative).
    - Official 234: competition **0.8734** (v2 0.8589, v3 0.8583); stable-label mean 0.8254; mean 0.8169.
    - Paired bootstrap on competition AUC: v4−v2 +0.015 (95% CI 0.000 to +0.030, P 0.98); v4−v3 +0.015 (CI +0.004 to +0.027).
    - Atelectasis 0.754 → 0.807 vs v3. Cardiomegaly unchanged (0.786; sensitivity 0.25 at the F1 threshold).
  - v5 `ViT_Models/Official_retrain_v5_squeezevit_kd/` (set up 2026-10-17; smoke-tested, not yet trained): SqueezeViT with the v2 recipe and the v4 per-label uncertainty policy, distilled from FastViT v4. Loss = 0.5 × masked label BCE + 0.5 × BCE against v4 probabilities. `make_teacher_probs.py` must run first and writes `results/teacher_v4_train.npz`. Same architecture and contract as v1/v2, so the existing exporter works.
    - Trained 2026-10-17: best epoch 30 (plateau from about epoch 23); held-out competition 0.7939.
    - Official 234: competition **0.8806**, stable-label mean 0.8300.
    - Paired bootstrap: v5−v2 +0.022 competition (95% CI +0.011 to +0.033) and +0.019 stable (CI +0.007 to +0.030). v5−v4 +0.007 (CI −0.007 to +0.020, not significant).
    - Atelectasis 0.849 (best of all runs). Support Devices 0.838 (v4 0.913).
    - Bundle `model-input/squeezevit-retrain-v5-kd-attention-20261017.1` (checkpoint `1b8da78f…aa2ebeb`, thresholds `f1-heldout-custom-all-views-v5`) passed `model:validate` on 2026-10-17 and was activated locally (revision 4).
    - Bundle `…-cardio042-20261017.1`: same model.onnx, but the Cardiomegaly threshold drops 0.68 → 0.42 (highest threshold with held-out sensitivity ≥ 0.80, rule fixed before looking at official results). Threshold version `f1-heldout-custom-all-views-v5+cardiomegaly-sens80-0.42`.
      - Official 234 Cardiomegaly: sensitivity 0.31 → 0.49, specificity 0.98 → 0.93, false positives 3 → 12.
      - Passed `model:validate` on 2026-10-17. Activated locally.
    - Bundle `squeezevit-v5-kd-cardio042-possible85-20261017.1`: same model and likely thresholds, plus `possible-thresholds.json`.
      - Possible thresholds apply to the five competition labels only, at held-out sensitivity ≥ 0.85: Cardiomegaly 0.33, Edema 0.41, Consolidation 0.32, Atelectasis 0.40, Pleural Effusion 0.43. Other labels' possible threshold equals their threshold.
      - Rejected rules (judged on held-out): all-label sensitivity 0.85 gave 3.6 possible findings per case at 7% precision. A specificity cap removed the tier for the main labels. A precision floor gave near-zero thresholds on common labels only.
      - Official 234: 0.58 possible per case at 24% precision; missed findings 257 → 224; Consolidation sensitivity 0.42 → 0.94.
      - Passed `model:validate` on 2026-10-17. Activated locally 2026-10-18; Learning Mode shows the possible tier. The owner reports it is deployed to hosted production (2026-10-18; not independently verified).
  - Bundle `model-input/squeezevit-retrain-v2-attention-20261013.1` (thresholds `f1-heldout-custom-all-views-v1`) passed `model:validate` on 2026-10-13. Not staged or activated yet.
- `ViT_Models/Official_retrain_v3_fastvit/` (2026-10-15) keeps the v2 recipe but swaps the model for FastViT-SA12 (`timm` `fastvit_sa12.apple_in1k`, ImageNet-1k pretrained, loaded from a local `pretrained/` safetensors copy, SHA-256 `4c41bc35…b5afa`). Grayscale is repeated to 3 channels inside the model, so preprocessing is unchanged. Peak LR 1e-4.
  - Best epoch 5 of 30 (EMA), checkpoint SHA-256 `e549be3b…bf14`. Held-out AUC fell every epoch after 5 while training loss kept dropping (overfitting); 0.7575 by epoch 30.
  - Held-out competition AUC: 0.8092 overall, 0.805 frontal, 0.813 lateral.
  - Official 234: competition 0.8583 and mean 0.8032 overall; competition 0.8555 and mean 0.8107 on the 202 frontal. Competition AUC ties v2; mean AUC is clearly higher.
  - Weak labels on the official 234: Enlarged Cardiomediastinum 0.50, Lung Lesion 0.38.
  - Bundle `model-input/fastvit-retrain-v3-attention-20261016.1` (thresholds `fastvit-v3-f1-heldout-custom-all-views-v1`, ONNX 42.3 MB of the 50 MB limit) exported with [export_fastvit.py](../../../model-export/export_fastvit.py) and passed `model:validate` on 2026-10-16 (WebGPU disabled). The owner staged and activated it on 2026-10-17.
  - `tune_thresholds.py --sensitivity 0.8` picks the highest threshold reaching that held-out sensitivity. Applied to all labels it floods weak labels on the official 234 (Fracture specificity 0.46, Pneumonia precision 0.06), so only the 5 competition labels use the lower of the F1 and 80%-sensitivity thresholds. All others keep F1 (`results/thresholds_mixed.json`).
  - Official 234 sensitivity vs F1-only: Cardiomegaly 0.28→0.49, Edema 0.76→0.82, Consolidation 0.39→0.91, Atelectasis 0.55→0.75; specificity 0.99→0.95, 0.90→0.86, 0.97→0.74, 0.78→0.62. Pleural Effusion unchanged.
  - Bundle `model-input/fastvit-retrain-v3-attention-20261017.1` (same ONNX, thresholds `fastvit-v3-sens80-competition-f1-other-v1`) passed `model:validate` on 2026-10-17. Not staged yet.

## Connected to

Produces the checkpoint for [Model release](model-release.md). Its preprocessing is the contract for the [preprocessing tensor](preprocessing-tensor.md). The [manifest and thresholds](model-manifest-configuration.md) are configured separately. The [Built-in X-ray library](../learning/built-in-xray-library.md) serves the same 234 validation images.

## If you change this

### Hits

- A new checkpoint means a new release bundle, V1/V2 export, fixtures, parity evidence, and threshold re-check (see [model validation](../../processes/model-validation.md)).
- Changing preprocessing breaks parity with `src/lib/inference/preprocess.ts` and needs a new manifest version.

### Does not hit

- The app code, as long as the release keeps the same input/output contract.

## See

`ViT_Models/Official_retrain_v1/train_official.py`, `evaluate_official.py`, `run-config.json`. These are external and not versioned in this repo.
