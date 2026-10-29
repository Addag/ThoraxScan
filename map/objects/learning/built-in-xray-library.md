---
node_type: object
universe: live
status: verified
audited: 2026-10-18
snapshot: main @ 5a45326
---

# Built-in X-ray library

A bundled, read-only gallery of all 234 JPEGs from the CheXpert-v1.0-small `valid` folder (202 frontal, 32 lateral). Selecting a case fetches the static JPEG and hands it to the caller as a browser `File`; the library itself never writes anywhere.

## Why this shape

A static manifest plus public JPEGs gives Learning Mode and Professor activity authoring shared practice images without a migration, bucket, or new upload path. Callers treat the `File` exactly like a local pick, so existing validation, inference, and signed-upload flows stay the only paths.

## Shape

- `cases.json` holds one entry per image: `id` (`cxp-NNN`), `title` (`Case NN`), `view` (Frontal/Lateral), `projection` (AP/PA or empty), `imageUrl` (`/images/chexpert/{id}.jpg`), original `sourcePath`, `sha256`, and all 14 CheXpert label values (1, 0, -1, or null) in [cases.json](<../../../src/lib/xray-library/cases.json>). Patient age/sex are not copied.
- Case order and numbering follow `valid.csv` row order; the manifest and images are regenerated only by [import-chexpert-library.ps1](<../../../scripts/import-chexpert-library.ps1>) from a local dataset copy.
- The client component filters by view and by positive dataset label, fetches the chosen JPEG, rejects empty/non-JPEG responses, and calls `onSelect(file)` in [xray-library.tsx](<../../../src/components/learning/xray-library.tsx:8>).
- Consumers: the [Learning Mode analyzer](<../../../src/components/learning/learning-mode-analyzer.tsx:132>) (replaces the former "Sample Gallery" placeholder), which shows all 234, and the Professor [CaseUploadForm](<../../../src/components/professor/activity-forms.tsx:203>), which passes `frontalOnly` (202 frontal cases only) and disables it while preparing, uploading, or confirming.
- A Vitest check asserts the 234/202/32 counts, unique source paths, SHA-256 match, ≤ 6 MiB, and decodable JPEG metadata in [cases.test.ts](<../../../src/lib/xray-library/cases.test.ts>).

## Known gaps

- Lateral support is scoped to Learning Mode. The Professor form passes `frontalOnly`, which hides lateral cases and the view filter, so library picks for activities are frontal. A lateral file uploaded from disk is caught by the [View detector](view-detector.md) about 99.5% of the time; the [X-ray case](xray-case.md) row is always written with `view_position = 'frontal'`. The attestation copy no longer says "frontal"; the server error text still does. Active v5 lateral numbers are in [Model training](../inference/model-training.md).
- All 234 cases are the official `valid.csv` images. v1 picked its checkpoint on them, so v1 results on library cases were optimistic. v2–v6 pick checkpoints and thresholds on the held-out custom split, so the active v6 release scores them as unseen test images.
- Dataset labels are reference data only; they are not written into the Professor's private reference evaluation.
- Images are public static assets once deployed; the [README](<../../../src/lib/xray-library/README.md>) flags that redistribution permission under the CheXpert agreement is unconfirmed.

## Connected to

Feeds [Local Learning Mode image](local-learning-mode-image.md) and the [X-ray case](xray-case.md) upload in [activity authoring](../../processes/activity-authoring-publication.md). Unrelated to the [X-ray sample asset](../ui/xray-sample-asset.md).

## If you change this

### Hits

- `cases.json` shape (component, test, importer must agree), `public/images/chexpert/` files and hashes, gallery filters/copy and their Tailwind utilities in `xray-library.tsx`, Learning Mode and Professor upload browser tests.

### Does not hit

- Database migrations, Storage policies, the model registry, or inference preprocessing — selected cases enter those paths only as an ordinary `File`.

## Surfaces

Static public assets and client UI inside Learning Mode and the Professor activity upload form.

## See

[xray-library.tsx](<../../../src/components/learning/xray-library.tsx>), [README](<../../../src/lib/xray-library/README.md>)
