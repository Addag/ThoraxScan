---
node_type: object
universe: live
status: verified
audited: 2026-10-28
snapshot: main @ b21559d + working tree
---

# View detector

A server-side frontal/lateral classifier that rejects confident lateral uploads during Professor case confirmation. Activities are frontal-only; Learning Mode does not use it.

## Why this shape

A 32×32 grayscale thumbnail and one small hidden layer separate the two views well, so the detector runs in plain TypeScript on `sharp`, which the upload check already uses. There is no ONNX model, no new dependency, and no browser step a client could skip.

## Shape

- [features.ts](<../../../src/lib/view-detector/features.ts>) is the only preprocessing: EXIF auto-rotate, drop alpha, greyscale, `fit: "fill"` resize to 32×32, then scale to 0–1. Training features come from the same function, so training and serving inputs match exactly.
- [index.ts](<../../../src/lib/view-detector/index.ts>) runs the 1024 → 32 (ReLU) → 1 (sigmoid) forward pass from [weights.json](<../../../src/lib/view-detector/weights.json>) (about 650 KB, server-only). `looksLateral()` returns true at or above the stored threshold.
- `confirmCaseUploadAction` calls it after the decode check. On a lateral call it deletes the uploaded object and returns "This image looks like a lateral view. Activities accept frontal chest X-rays only." The case stays pending, as it does after a decode failure, so the Professor can upload again ([actions.ts](<../../../src/app/(protected)/professor/activities/actions.ts:368>)).

## Training

- [dump-view-features.mts](<../../../scripts/dump-view-features.mts>) writes features and labels from a CheXpert CSV (`Frontal/Lateral` column). [train_view_detector.py](<../../../model-export/train_view_detector.py>) trains scikit-learn `MLPClassifier(32)` on `train_custom_all_views.csv` (200,992 images, 29,171 lateral).
- Threshold: the higher of 0.5 and the score that rejects at most 0.1% of held-out frontals. It came out at 0.5.
- Held-out `valid_custom_all_views.csv` (22,422 images): 17 of 19,206 frontals rejected (0.09%), 3,199 of 3,216 laterals caught (99.5%).
- Official 234 (test only): 0 of 202 frontals rejected, 32 of 32 laterals caught. [index.test.ts](<../../../src/lib/view-detector/index.test.ts>) asserts this over the library JPEGs.
- Logistic regression caught only 94.3% of held-out laterals at the same frontal limit; 64 hidden units gave no gain over 32.

## Known gaps

- Trained and tested on CheXpert-small JPEGs only. Images from other sources (other hospitals, full-resolution PNGs, phone photos, inverted or rotated films) are unmeasured.
- About 1 in 1,000 frontals is rejected, and there is no override. A Professor who hits one must choose another image.
- About 1 in 200 laterals still passes, so the attestation remains the backstop and `view_position` is still always `frontal`.
- Retraining is manual. Rerun both scripts and commit the new `weights.json`; there is no registry, staging, or rollback as there is for [Model release](../inference/model-release.md).

## Connected to

Guards the [X-ray case](xray-case.md) upload in [activity authoring](../../processes/activity-authoring-publication.md). Independent of the [Browser inference runtime](../inference/browser-inference-runtime.md) and the active model.

## If you change this

### Hits

- `weights.json` shape (index.ts and the training script must agree), `viewFeatures()` (retrain after any change), the upload confirmation error path, and the library detector test.

### Does not hit

- Migrations, Storage policies, the model registry, browser inference, or Learning Mode.
