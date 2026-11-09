---
node_type: object
universe: live
status: verified
audited: 2026-11-09
snapshot: main @ 902eae2 + working tree
---

# Chest X-ray gate

A small classifier that refuses images that are not chest X-rays. It runs in the browser before Learning Mode inference and on the server during Professor case confirmation.

## Why this shape

The disease model scores any image it is given, so photos and documents produced confident "findings". Learning Mode images never leave the browser, so the gate must run there. Its features therefore come from raw RGBA through one pure function rather than from sharp's resize, which the view detector uses.

## Shape

- [features.ts](<../../../src/lib/chest-gate/features.ts>): `chestFeatures(rgba, w, h)` returns a 32×32 greyscale box average (Rec. 601 luma), a colourfulness score (mean max−min channel spread), and the width/height `aspect`.
- [index.ts](<../../../src/lib/chest-gate/index.ts>): `passesChestGate()` requires `aspect` within 0.72–1.6 (constants in `index.ts`), then colourfulness ≤ `maxColourfulness`, then runs the 1024 → 64 (ReLU) → 1 (sigmoid) MLP from [weights.json](<../../../src/lib/chest-gate/weights.json>) (~1.4 MB, bundled into the lazily loaded inference chunk) and requires a score ≥ `threshold`.
- Browser: `analyzeImage(..., { requireChestXray: true })` in [runtime.ts](<../../../src/lib/inference/runtime.ts>) checks right after `decodeImage` and throws `NOT_CHEST_XRAY`. Only Learning Mode passes the flag. Activity analysis skips it because its case already passed the server check.
- Server: [server.ts](<../../../src/lib/chest-gate/server.ts>) decodes with sharp (`rotate`, `ensureAlpha`, `raw`) into the same function. `confirmCaseUploadAction` rejects failing uploads before the lateral check and deletes the object.

## Training

- [dump-chest-features.mts](<../../../scripts/dump-chest-features.mts>) reads `label<TAB>path` lists. [train_chest_gate.py](<../../../model-export/train_chest_gate.py>) trains `MLPClassifier(64)`. 32 units could not separate limb X-rays from chest X-rays without refusing far more chests.
- Positives: 30,000 sampled from CheXpert `train_custom_all_views.csv`; held out: 5,000 from `valid_custom_all_views.csv`. Negatives (80/20 split): Imagenette-160 photos (13,394), MedMNIST+ 64 px OrganCMNIST CT (6,000), BreastMNIST ultrasound (780), RetinaMNIST fundus (1,600), 3,000 generated light/dark report documents, and 4,026 FracAtlas musculoskeletal X-rays (hand, leg, hip, shoulder; figshare article 22363012, CC BY 4.0, Abedeen et al. 2023; 59 truncated JPEGs in the archive skipped). FracAtlas was appended as its own 80/20 split so the earlier splits stay identical.
- Threshold: the lower of 0.5 and the score that rejects at most 0.1% of held-out chest X-rays (0.0653). Colour limit: the higher of 0.08 and the 99.9th-percentile chest colourfulness (0.08).
- Held out (v2): 5 of 5,000 chest X-rays rejected; 5,653 of 5,761 others caught (documents, ultrasound and fundus 100%, FracAtlas X-rays 98.3%, photos 98.5%, abdominal CT 95.5%). Official 234: none rejected. Before FracAtlas (v1), 26% of all FracAtlas images passed. [index.test.ts](<../../../src/lib/chest-gate/index.test.ts>) checks the library and a few non-chest images.

- Shape rule: the features squash every image square, so a tall crop of a foot or arm fills the frame like a chest (a 0.46-wide foot scored 0.98). Retraining with anatomy-tight crops of FracAtlas and CheXpert (v3) did not close this and made abdominal CT worse (4.5% → 6.7% passing), so v2 weights stay and the shape limit does the work. Held-out images cropped tight to the anatomy now pass 1.1% of the time.

## Known gaps

- Only limb, hip and shoulder X-rays were in training. Spine, skull, abdomen and pelvis films are untested and may pass. Abdominal CT slices pass about 1 in 22.
- FracAtlas was split by image, not by patient, so its held-out rate may be slightly optimistic.
- About 1 in 400 chest X-rays is refused (12 of 5,000 held out, including 7 narrower than 0.72), with no override.
- Browser and sharp JPEG decoders can differ slightly; at 32×32 this has not mattered on the library.
- Retraining is manual: rebuild the lists, rerun both scripts, and commit `weights.json`.

## Connected to

Guards [Learning Mode](../ui/student-learning-mode-surface.md) inference and [X-ray case](xray-case.md) upload alongside the [view detector](view-detector.md). Independent of the active model and the model registry.

## If you change this

### Hits

- `chestFeatures()` (retrain after any change), `weights.json` shape, the Learning Mode `NOT_CHEST_XRAY` copy, the upload error path, and the gate test.

### Does not hit

- Migrations, Storage policies, the model registry, or activity AI analysis.
