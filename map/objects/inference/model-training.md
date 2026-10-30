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
| Preprocessing | `browser-contract-v1-bilinear-center-rec601`: Rec. 601 grayscale, center-aligned bilinear 224×224 without antialiasing, (x−0.5)/0.25. Mirrors the browser [preprocessing tensor](preprocessing-tensor.md). Training images are CheXpert-small (short side 320), so the `shortside320` release mode is the same transform for them |
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
      - Held-out by view (epoch 30): frontal competition 0.7889, mean 0.7842; lateral (3,216 images) competition 0.8019, mean 0.7446. Lateral is on par for the competition labels and weaker on the rest.
      - Official 234 by view: frontal competition 0.8801, stable 0.8321; lateral (32) competition 0.8882, stable 0.8203, mean 0.8619 (too few images for per-label claims).
      - Thresholds are tuned on all views together, not per view.
      - Release scope (2026-10-28): laterals are supported in Learning Mode only; activities stay frontal-only.
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
  - v6 `ViT_Models/Official_retrain_v6_nih/` (trained 2026-10-29): the v5 recipe unchanged, plus NIH ChestX-ray14 `train_val_list` (86,524 frontal images, pre-resized to 320×320 in `nih-chest-xray/images_320`). Combined training set 287,516 rows.
    - `make_nih_csv.py` maps NIH labels to CheXpert columns (Effusion → Pleural Effusion, Mass/Nodule → Lung Lesion, Infiltration → Lung Opacity, Pleural_Thickening → Pleural Other). Enlarged Cardiomediastinum, Fracture and Support Devices are `MISSING = -2` for NIH rows, which `common.py` drops from the label loss. All 880 `BBox_List_2017` images are in `test_list`, so the boxes never reach training.
    - Teacher: FastViT v4 over the combined CSV. Best epoch 29 of 30; held-out competition 0.7955 (v5 0.7939). Checkpoint SHA-256 `0e771eb8…6a5c78a`.
    - Release-rule thresholds (`results/thresholds_release.json`, `possible_thresholds_release.json`): Cardiomegaly 0.48 at sensitivity 80%, others F1; possible tier Cardiomegaly 0.39, Edema 0.49, Consolidation 0.31, Atelectasis 0.46, Pleural Effusion 0.49.
    - Gate (`compare_v5.py`, rules fixed before results, `results/compare_v5.json`):
      - Official 234 competition 0.8767 vs v5 0.8806, difference −0.0038 (95% CI −0.0135 to +0.0056). **Fails** the non-inferiority margin (lower bound ≥ −0.005).
      - NIH `test_list` (25,596) competition 0.8088 vs v5 0.7791, +0.030 (CI +0.027 to +0.032); mean AUC 0.775 vs 0.738. Passes.
      - Official Cardiomegaly sensitivity at the release threshold 0.50 (v5 0.48). Passes.
      - The margin is narrower than the 234-image CI (about ±0.01), so it can fail even for an equivalent model.
    - False positives at release thresholds (`results/false_positives_v5_v6.csv`, No Finding excluded): official 234 likely tier 235 → 204 (precision 0.638 → 0.657); NIH test 48,515 → 25,362 (precision 0.237 → 0.322). The cost is more misses: 238 → 263 official and 10,245 → 13,241 NIH. NIH Lung Lesion false positives rise from 1,794 to 3,848.
    - On 2026-10-30 the owner chose to release v6 despite the official-234 gate result. Bundle `model-input/squeezevit-v6-nih-cam-possible85-20261030.1` (contract V3, model SHA `a3c0e297…26b47e7`, bundle SHA `cb4566f6…406373bb`, threshold version `f1-heldout-v6+cardiomegaly-sens80-0.48+possible-competition-sens85`) passed `model:validate` with WebGPU enabled (diff 9.2e-7). Staged and activated in local Supabase on 2026-10-30 (model release 63, slot revision 3; previous v5 CAM at revision 2). Learning Mode case 01 runs on WebGPU: Cardiomegaly 66.4% and Support Devices 61.3% likely. The owner reports activating it in hosted production on 2026-10-30. Not independently verified: `get_active_model_release` denies anonymous callers.
  - v7 `ViT_Models/Official_retrain_v7_tinyvit/` (trained 2026-10-30): TinyViT-11M (hybrid ViT: MBConv stage plus three attention stages, 10.6M params, ImageNet-22k → 1k weights from a local safetensors copy the owner downloaded, SHA-256 `b08354fd…38b1b6`). It reuses v6's CSVs and teacher file, label policy, augmentation, KD and selection. Grayscale is mapped to ImageNet statistics inside `tinyvit_thoraxscan.py`, so the browser contract is unchanged. Peak LR 1e-4, 10 epochs, drop-path 0.1.
    - Best epoch 10 (plateau from about epoch 7); held-out competition 0.8084, mean 0.8036 (v6 0.7955 / 0.7853). Checkpoint SHA-256 `cb50be7a…902eb86b`.
    - Thresholds use v6's rule: Cardiomegaly 0.50 at sensitivity 80%, others F1. Possible tier: Cardiomegaly 0.41, Edema 0.55, Consolidation 0.31, Atelectasis 0.46, Pleural Effusion 0.52.
    - Gate (`compare_v6.py`, rules fixed before results, `results/compare_v6.json`): **passes**.
      - Official 234 competition 0.8801 vs v6 0.8767 (+0.003, CI −0.008 to +0.015); mean AUC 0.834 vs 0.775 (Lung Lesion 0.12 → 0.75, Support Devices 0.84 → 0.92, Pleural Other 0.90 → 0.97).
      - Official at release thresholds: missed 263 → 246, false alarms 204 → 185.
      - NIH test competition 0.8225 vs 0.8088 (+0.014, CI +0.012 to +0.016); missed 13,241 → 11,702, false alarms 25,362 → 26,518.
    - Pointing game (NIH boxes, CAM upsampled 7×7 → 14×14): 47.9% (v6 CAM 35.5%, v5 rollout 37.2%).
    - Bundle `model-input/tinyvit-v7-nih-cam-possible85-20261030.1` (contract V3, [export_tinyvit_cam.py](../../../model-export/export_tinyvit_cam.py), ONNX 42.8 MB, model SHA `f7afebcb…e5a77e0`, bundle SHA `ac412abe…f0400aeb`) passed `model:validate` on 2026-10-30 with WebGPU enabled (diff 1.5e-6). Staged and activated in local Supabase on 2026-10-30 (model release 64, slot revision 4; v6 at revision 3). Learning Mode case 232 runs on WebGPU in about 4 s including the first model download. Active in hosted production from 2026-10-30 (model release 12, revision 12, per the owner's `model:status` output) until the sr320 release replaced it the same day; now the hosted rollback target.
    - Enlarged Cardiomediastinum causes 105 of v7's 246 official misses: AUC 0.50, 109/234 official positives against 4.9% held-out prevalence (radiologist vs report-mined labels). Options measured on the official 234 (scratch analysis, 2026-10-30): a Cardiomegaly → ECM rule 431 → 398 errors; fewest-errors thresholds 441 (misses 397); v6+v7 average 439 (official AUC 0.884, NIH worse).
    - Bundle `model-input/tinyvit-v7-nih-cam-ecm-possible85-20261030.1` adds that rule in the export (`export_tinyvit_cam.py --ecm-rule-thresholds`): ECM logit = max(ECM, Cardiomegaly + logit(0.56) − logit(0.50)), so ECM is flagged exactly when ECM or Cardiomegaly crosses its threshold, and ECM shows the Cardiomegaly map when the rule decides. Other labels are unchanged. Model SHA `44c9f6d1…a5e45`, bundle SHA `66d3b462…d154f65`, threshold version `…+ecm-implied-by-cardiomegaly`.
      - The shipped ONNX on the 234 library images: missed 245 → 208, false alarms 185 → 189 (ECM misses 105 → 68).
      - Passed `model:validate` with WebGPU (diff 1.5e-6). Active in local Supabase since 2026-10-30 (model release 64 → 65, revision 5). Not staged in production.
    - Radiologist-label thresholds (2026-10-30, scratch `radiologist_thresholds.py`, results in v7 `results/radiologist_thresholds.json`): CheXpert test set from the owner's CheXlocalize download (668 images, 5-radiologist majority vote, full size), labels with ≥ 30 positives re-tuned. **Not adopted**: on the official 234 the F1 rule trades misses for false alarms (208/189 → 99/420); fewest-errors tuning is at best 412 → 397 in a matched image pipeline and 416 → 412 on full-size input. v7's thresholds stay.
    - Full-size uploads score lower: the contract's bilinear resize has no antialias filter, so the official 234 at full size (CheXlocalize copy) gives competition 0.870 and 416 errors vs 0.880 and 397 from the CheXpert-small copies; an antialiased downscale first gives 0.885.
    - Fix: CheXpert-small matches a plain bilinear shrink to short side 320 (cv2 `INTER_LINEAR`), so the `shortside320-bilinear-center` resize repeats it. On full-size images: official 234 competition 0.881 and 405 errors (probabilities within 0.007 of the small copies, so thresholds carry over); radiologist test set 0.887 → 0.897, mean AUC 0.851 → 0.871, errors 1,110 → 1,053.
    - Bundle `model-input/tinyvit-v7-nih-cam-ecm-possible85-sr320-20261030.1`: the ECM bundle's model and thresholds with `resizeInterpolation` set, preprocessing version `browser-contract-v1-shortside320-bilinear-center-rec601`, and a 480×400 fixture. Bundle SHA `0db87148…3ae140d`; passed `model:validate` on 2026-10-30 (WebGPU enabled, diff 1.5e-6). Active in local Supabase since 2026-10-30 (model release 65 → 73, revision 6). In Learning Mode on WebGPU, the full-size original of library case 232 (2828×2320) gives the Python two-stage probabilities to 0.01% on all 14 labels, and library case 232 is unchanged; all 234 library tensors are byte-identical to the single-stage path. Activated in hosted production on 2026-10-30 after the app deploy (owner-reported; revision 13 expected, not independently verified), replacing `tinyvit-v7-nih-cam-possible85-20261030.1`, the rollback target.
  - v8 `ViT_Models/Official_retrain_v8_tinyvit320/` (trained 2026-10-30): v7 at 320×320 input instead of 224 (same 224px pretrained weights, data, teacher, recipe, selection; 128 images per step as two micro-batches of 64 to fit 16 GB). Not exported; the app stays at 224.
    - Best epoch 10; held-out competition 0.8078 (v7 0.8084). Checkpoint SHA-256 `38ad1ef0…4c89ac65`. Thresholds by v7's rule (Cardiomegaly 0.48 at sensitivity 80%).
    - Gate (`compare_v7.py`, rules fixed before results, both models with the ECM rule, `results/compare_v7.json`): **fails**, so the 320px app contract change was not made.
      - Official 234 competition 0.8804 vs 0.8801 (+0.0003, CI −0.010 to +0.010); mean AUC 0.826 vs 0.834.
      - Official at release thresholds: missed 209 → 208, false alarms 189 → 192 (397 → 400).
      - NIH test competition 0.8215 vs 0.8225 (−0.001, CI −0.002 to +0.000).
    - Official 234 per label vs v5 (for v6): Edema 0.921 (0.916), Cardiomegaly 0.806 (0.803), Consolidation 0.903 (0.906), Atelectasis 0.836 (0.849), Pleural Effusion 0.917 (0.929).
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
  - Bundle `model-input/fastvit-retrain-v3-attention-20261016.2` (same ONNX and thresholds as `.1`, new release ID) passed `model:validate` on 2026-10-21 with WebGPU enabled (logit diff 8.6e-6, attention diff 6.9e-6 vs WASM). Not staged yet.

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
