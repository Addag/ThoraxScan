# ThoraxScan models

Every AI model ThoraxScan has trained, shipped, or evaluated. ThoraxScan uses
two models in the app:

- **The finding classifier** (`thoraxscan-classifier` slot) runs in the browser
  and predicts 14 chest X-ray findings with a heatmap for each one. It has gone
  through nine training runs and fifteen release bundles.
- **The view detector** runs on the server and rejects lateral images when a
  Professor uploads an activity case.

Two more models were used only during development (see
[Development-only models](#development-only-models)).

> These are educational models. None has been clinically validated, and their
> output must not be used for patient care.

## Live now

| | |
|---|---|
| Hosted release | `tinyvit-v7-nih-cam-ecm-possible85-sr320-20261030.1` (revision 13, activated 2026-10-30) |
| Architecture | TinyViT-11M, 10.6M parameters, ImageNet-22k pretrained |
| Training data | CheXpert train + NIH ChestX-ray14 `train_val_list` (287,516 images) |
| Teacher | FastViT-SA12 v4 (knowledge distillation) |
| Contract | V3: 224×224 grayscale input, 14 logits, 14×14 class activation map per label |
| Official 234 | Competition AUC 0.880, mean AUC 0.834 |
| Rollback target | `tinyvit-v7-nih-cam-possible85-20261030.1` |

## How to read the numbers

- **Labels:** the 14 CheXpert labels, in the order fixed in
  [`src/lib/inference/contract.ts`](../src/lib/inference/contract.ts).
- **Competition AUC:** mean ROC AUC over the five CheXpert competition labels
  (Cardiomegaly, Edema, Consolidation, Atelectasis, Pleural Effusion).
- **Official 234:** the CheXpert `valid` set (202 frontal, 32 lateral), labelled
  by radiologists. These are also the images in the built-in case library.
- **Held-out:** the project's own patient-level split of CheXpert train
  (22,422 images), used to pick checkpoints and thresholds.
- **NIH test:** NIH ChestX-ray14 `test_list` (25,596 images), used from v6 on.
- **Gate:** a comparison against the previous run with pass rules fixed before
  the results were seen.
- **Likely / possible:** the main thresholds give "likely" findings. From the
  `possible85` bundles on, a lower "possible" tier (held-out sensitivity ≥ 0.85,
  competition labels only) is shown in Learning Mode.

## Finding classifier: training runs

Training happens outside this repository, in the owner's `ViT_Models/` folders.
Checkpoints are never committed.

| Run | Architecture | Data | Best epoch | Held-out comp. AUC | Official 234 comp. AUC | Outcome |
|---|---|---|---|---|---|---|
| Early custom | SqueezeViT | CheXpert, custom frontal split | — | — | 0.857 (202 frontal) | First local bundle only |
| v1 | SqueezeViT | CheXpert train, all views | 10 / 50 | — | 0.841 | Hosted (V1, V2) |
| v2 | SqueezeViT | CheXpert, all-views split | 26 / 30 | 0.794 | 0.859 | Validated, never staged |
| v3 | FastViT-SA12 | CheXpert, all-views split | 5 / 30 | 0.809 | 0.858 | Hosted |
| v4 | FastViT-SA12 | CheXpert, all-views split | 6 / 8 | 0.804 | 0.873 | Not exported; teacher for v5–v8 |
| v5 | SqueezeViT, distilled | CheXpert, all-views split | 30 / 30 | 0.794 | 0.881 | Hosted |
| v6 | SqueezeViT, distilled | CheXpert + NIH | 29 / 30 | 0.796 | 0.877 | Hosted (gate failed, owner chose to ship) |
| **v7** | **TinyViT-11M, distilled** | **CheXpert + NIH** | **10 / 10** | **0.808** | **0.880** | **Live** |
| v8 | TinyViT-11M at 320×320 | CheXpert + NIH | 10 / 10 | 0.808 | 0.880 | Gate failed, not exported |

### Early custom run

The first SqueezeViT checkpoint (`squeezevit_b128_e8_mean07733.pth`), trained on
a frontal-only custom split. Its only bundle, `squeezevit-official-valid-20260908.1`,
scored competition AUC 0.857 and mean AUC 0.761 on the 202 official frontal
images at fixed 0.5 thresholds. It was never hosted.

### v1: official retrain

- **Model:** custom SqueezeViT (`squeezevit_thoraxScan.py`): convolutional Fire
  modules plus transformer encoder blocks over a 7×7 token grid. About 3 MB as ONNX.
- **Data:** all 223,414 CheXpert train images (frontal and lateral, no view
  filter); uncertain labels count as negative.
- **Recipe:** BCE with per-label positive weights (capped at 10), AdamW at 1e-4,
  batch 128, 50 epochs; best mean competition AUC at epoch 10.
- **Results:** official 234 competition AUC 0.841, mean 0.740.
- **Shipped as:** the first hosted model (V1) and the first heatmap model (V2
  attention rollout). Thresholds were a fixed 0.5.

### v2: augmented SqueezeViT

- Same model on the all-views custom split, adding augmentation (no horizontal
  flip), warmup plus cosine learning rate, and EMA weights.
- Thresholds tuned per label for F1 on the held-out split.
- Official 234 competition AUC 0.859, mean 0.768. Validated on 2026-10-13 but
  never staged.

### v3: FastViT-SA12

- `timm` FastViT-SA12, ImageNet-1k pretrained, 10.6M parameters; grayscale is
  repeated to three channels inside the model. About 41 MB as ONNX.
- Overfit after epoch 5 of 30.
- Official 234 competition AUC 0.858 (ties v2) but mean AUC 0.803 (clearly
  higher). Weak on Enlarged Cardiomediastinum (0.50) and Lung Lesion (0.38).
- First release with 80%-sensitivity thresholds for the competition labels, and
  the first with WebGPU enabled.

### v4: FastViT with per-label uncertainty

- v3 shortened to 8 epochs with drop-path 0.1, plus a per-label policy for
  uncertain labels during training: uncertain Atelectasis and Edema count as
  positive, uncertain Cardiomegaly is left out, and the rest count as negative.
- Official 234 competition AUC 0.873, better than v2 and v3 (bootstrap CI
  excludes zero against v3).
- Never exported. Its predictions are the distillation teacher for v5 through v8.

### v5: SqueezeViT distilled from v4

- SqueezeViT with the v2 recipe and v4's uncertainty policy. Loss is half label
  BCE, half BCE against v4's probabilities.
- Official 234 competition AUC 0.881, significantly better than v2 (+0.022).
  Atelectasis 0.849 was the best of all runs.
- Releases added a Cardiomegaly threshold of 0.42 (80% held-out sensitivity),
  then the possible tier, then per-finding class activation maps (contract V3).
- Lateral images: competition AUC on par with frontal, weaker on other labels.
  Laterals are allowed in Learning Mode only; activities stay frontal-only.

### v6: adding NIH ChestX-ray14

- v5 recipe plus 86,524 NIH frontal images. NIH labels are mapped to CheXpert
  columns; labels NIH lacks (Enlarged Cardiomediastinum, Fracture, Support
  Devices) are left out of the loss for NIH rows. NIH box images never reach
  training.
- NIH test competition AUC 0.809 vs v5's 0.779, and far fewer NIH false alarms.
- **Gate failed** on the official 234 (−0.004, CI −0.014 to +0.006 against a
  −0.005 margin). The owner shipped it on 2026-10-30 for the NIH gains.

### v7: TinyViT-11M (live)

- TinyViT-11M: an MBConv stage plus three attention stages, ImageNet-22k → 1k
  pretrained. Grayscale is mapped to ImageNet statistics inside
  `tinyvit_thoraxscan.py`, so the browser contract is unchanged. Same data,
  teacher, and recipe as v6; 10 epochs at 1e-4.
- **Gate passed:** official 234 competition AUC 0.880 (v6 0.877), mean AUC 0.834
  (v6 0.775); NIH test 0.823 (v6 0.809). Lung Lesion rose from 0.12 to 0.75.
- Heatmaps hit the NIH box in 47.9% of cases (pointing game), against 35.5% for
  v6.
- Two fixes in the live release:
  - **ECM rule:** Enlarged Cardiomediastinum scored AUC 0.50 and caused 105 of
    246 official misses. The exported graph now flags it whenever Cardiomegaly
    is flagged, matching CheXpert's label hierarchy. Misses fell to 208.
  - **Short-side-320 resize:** CheXpert-small was made by shrinking images to
    short side 320. Repeating that step before the 224 resize keeps full-size
    uploads at the same accuracy (radiologist test set competition AUC 0.887 →
    0.897).
- **Live error profile** (official 234, likely tier, 13 abnormal labels): 68% of
  findings caught, 7.9% of absent findings flagged. On a 668-image radiologist
  test set: 75% caught, 9.3% flagged. The biggest miss sources are Enlarged
  Cardiomediastinum, Cardiomegaly, and Consolidation.

### v8: TinyViT at 320×320

- v7 trained at 320×320 input instead of 224.
- **Gate failed:** no gain (official 234 competition AUC +0.0003, NIH −0.001),
  so the app contract was not changed to 320 px. Never exported.

## Finding classifier: release bundles

Each bundle is an immutable folder under the ignored `model-input/`, validated
with `npm run model:validate`. "Hosted" lists production slot revisions.

| Release | Run | Contract | Thresholds | Hosted revisions |
|---|---|---|---|---|
| `squeezevit-official-valid-20260908.1` | Early custom | V1 | Fixed 0.5 | Local only |
| `squeezevit-official-valid-20260916.1` | v1 | V1 | Fixed 0.5 | 1 |
| `squeezevit-attention-v2-20260922.1` | v1 | V2 | Fixed 0.5 | 2 |
| `squeezevit-retrain-v2-attention-20261013.1` | v2 | V2 | F1 | Never staged |
| `fastvit-retrain-v3-attention-20261016.1` | v3 | V2 | F1 | 4 |
| `fastvit-retrain-v3-attention-20261017.1` | v3 | V2 | 80% sensitivity on competition labels | 3, 5 |
| `fastvit-retrain-v3-attention-20261016.2` | v3 | V2 | As `.1`, WebGPU enabled | 9 |
| `squeezevit-retrain-v5-kd-attention-20261017.1` | v5 | V2 | F1 | 6 |
| `squeezevit-retrain-v5-kd-attention-cardio042-20261017.1` | v5 | V2 | + Cardiomegaly 0.42 | 7 |
| `squeezevit-v5-kd-cardio042-possible85-20261017.1` | v5 | V2 | + possible tier | 8 |
| `squeezevit-v5-kd-cam-possible85-20261029.1` | v5 | V3 | Same | 10 |
| `squeezevit-v6-nih-cam-possible85-20261030.1` | v6 | V3 | F1, Cardiomegaly 0.48, possible tier | 11 |
| `tinyvit-v7-nih-cam-possible85-20261030.1` | v7 | V3 | F1, Cardiomegaly 0.50, possible tier | 12 (rollback target) |
| `tinyvit-v7-nih-cam-ecm-possible85-20261030.1` | v7 | V3 | + ECM rule | Local only |
| `tinyvit-v7-nih-cam-ecm-possible85-sr320-20261030.1` | v7 | V3 | + ECM rule, short-side-320 resize | **13 (live)** |

Contract versions:

- **V1:** 14 logits only, no heatmap.
- **V2:** adds one global 7×7 attention-rollout map, the same for every finding.
- **V3:** replaces it with a 14×14 class activation map per finding.

See [`model-releases.md`](model-releases.md) for the full contract. The
activation times and reasons for each revision are in
[`map/objects/inference/active-model-slot.md`](../map/objects/inference/active-model-slot.md).

## View detector

| | |
|---|---|
| Version | `view-mlp32-32px-v1` |
| Purpose | Rejects confident lateral images in Professor activity uploads (activities are frontal-only) |
| Runs | Server-side, in plain TypeScript (`src/lib/view-detector/`) |
| Model | 32×32 grayscale thumbnail → 32 ReLU units → sigmoid, threshold 0.5 |
| Training | scikit-learn `MLPClassifier` on 200,992 CheXpert images (29,171 lateral), via `model-export/train_view_detector.py` |
| Held-out (22,422) | 99.5% of laterals caught, 0.09% of frontals rejected |
| Official 234 | 32 of 32 laterals caught, 0 of 202 frontals rejected |

Logistic regression caught only 94.3% of laterals at the same frontal limit,
and 64 hidden units gave no gain over 32. Learning Mode does not use the
detector.

## Development-only models

- **FastViT-SA12 v4** is the distillation teacher for v5 through v8. Its
  probabilities over the training images are precomputed; the model itself was
  never shipped.
- **torchxrayvision `densenet121-res224-all`** was tested on 2026-10-30 as a
  stronger teacher. It scored lower than v7 on competition AUC (0.852 vs 0.881
  on the official 234, 0.847 vs 0.897 on the radiologist set), so it was not
  adopted.

## Known limitations

- **Enlarged Cardiomediastinum** is the weakest label. The ECM rule helps, but
  it is still the largest source of misses.
- **Lateral views** were in training but are only lightly evaluated (32 official
  images), so activities accept frontal images only.
- **Threshold trade-off:** thresholds tuned on radiologist labels catch more
  findings but more than double false alarms, so they were not adopted.
- **Label noise:** CheXpert train and all NIH labels are mined from radiology
  reports. Only the official 234 and the 668-image CheXpert test set carry
  radiologist labels.

For full training details, hashes, and per-label results, see
[`map/objects/inference/model-training.md`](../map/objects/inference/model-training.md).
