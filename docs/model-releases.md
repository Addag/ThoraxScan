# Model release operations

ThoraxScan uses immutable, content-addressed ONNX releases. Development and
initial validation use local Supabase. The existing linked hosted Supabase
project is production and has its own independent `thoraxscan-classifier`
pointer. A staged release is inactive until an explicit compare-and-swap
activation succeeds.

Learning Mode runs inference in browser memory. Activity analyses persist through authorized RPCs; Students see maps only after submission and feedback release. Approved Professors with workspace access use a separate heatmap RPC. Direct analysis table reads remain revoked.

## Contract version 3

- Retains the V1 `logits` output and replaces V2's global map with `class_activation`, float32 `[batch, 14, 14, 14]`: one 14×14 class activation map per label, in label order.
- Method `cam-fc-weights-v1`: the classifier weights for each label applied to the pre-pool head features (exact for SqueezeViT's average-pool head, so `mean(raw map) + bias = logit`). Normalization `relu-per-label-max-v1`: negative evidence clipped to zero, then each label divided by its own maximum.
- V3 bundles include `fixtures/expected-class-activation.json` instead of `expected-attention.json`; the validator checks the same evidence, determinism and parity limits as V2. The fixture present decides the contract version, and a bundle may not carry both.
- V3 activity analyses persist all 2744 values in `attention_map`, with `attention_method = 'cam-fc-weights-v1'` and a 14×14 grid; the read RPCs are unchanged. The UI offers maps for likely and possible findings (Students, Learning Mode) or every finding (Professors, who don't receive probabilities).
- Export with `model-export/export_squeezevit_cam.py`.

## Contract version 2

- Retains the V1 `logits` output and adds `attention_map` as float32 `[batch, 1, 7, 7]`.
- Attention is global and class-agnostic: four averaged self-attention matrices receive identity, are row-normalized, multiplied in layer order, averaged across queries, and normalized per image to `[0,1]`.
- V2 bundles include `fixtures/expected-attention.json`; the validator checks its checksum, dimensions, range, determinism, WASM parity, and WebGPU/WASM parity.
- V2 activity analyses persist the normalized 49-value row-major map. Learning Mode keeps maps transient. Existing V1 analyses remain heatmap-unavailable.

## Contract version 1

- One ONNX file, default-domain opset 17, with no external tensor data.
- Float32 input `input` shaped `[batch, 1, 224, 224]`.
- Float32 output `logits` shaped `[batch, 14]`.
- Rec. 601 grayscale, center-aligned bilinear resize to 224 by 224, then
  `(pixel / 255 - 0.5) / 0.25` in NCHW layout.
- Sigmoid probabilities, inclusive thresholds, abnormal findings suppressing
  `No Finding`, and an explicit `no-threshold-match` state.
- The label order is fixed in `src/lib/inference/contract.ts`.

Weights, thresholds, provenance, and internal architecture may change without
an application deployment if this contract stays unchanged. A contract change
requires a new manifest parser and an application deployment.

## Untracked input bundle

Keep releases under the ignored `/model-input/<release-id>/` path. A bundle must
contain the release evidence consumed by the validator:

```text
model-input/<release-id>/
├── model.onnx
├── release.json
├── thresholds.json
├── possible-thresholds.json   # optional: Learning Mode "possible" tier
├── preprocessing-reference.py
└── fixtures/
    ├── preprocessing-input.png
    ├── expected-tensor.f32
    ├── model-input.f32
    ├── expected-logits.json
    ├── expected-probabilities.json
    ├── expected-attention.json          # V2 only
    └── expected-class-activation.json   # V3 only
```

V2 and V3 bundles also carry the exporter's `export-validation.json` next to `model.onnx`.

`release.json` has this shape:

```json
{
  "releaseId": "classifier-2026-08-24.1",
  "modelFamily": "thoraxscan-classifier",
  "checkpoint": {
    "id": "training-run-checkpoint-id",
    "sha256": "64-lowercase-hex-characters"
  },
  "sourceVersion": "training-code-commit-or-release",
  "preprocessingVersion": "preprocessing-v1",
  "thresholdVersion": "thresholds-v1",
  "resizeInterpolation": "bilinear-center"
}
```

`resizeInterpolation` is optional and defaults to `bilinear-center`, one resize
straight to 224. `shortside320-bilinear-center` first shrinks images whose short
side exceeds 320 to short side 320 (long side floored) with the same bilinear
math, the way CheXpert-small was made, so full-size uploads match the training
images. Such a bundle needs `model-export/preprocessing_shortside320.py` as its
`preprocessing-reference.py` and a fixture larger than 320 from its
`--write-fixture` option. The value becomes the manifest's
`preprocessing.resize.interpolation`; app builds that predate it reject such a
manifest, so deploy the app before activating the release.

`thresholds.json` must contain all 14 labels in the exact contract order, each
with a finite value from 0 through 1. The optional `possible-thresholds.json` has
the same shape. Each value must be at or below that label's threshold; set a value
equal to the threshold to give that label no possible tier. When present, the
manifest stores it as `labels[].possibleThreshold`. Learning Mode lists abnormal
labels in the band `[possibleThreshold, threshold)` as "Possible findings".
Activity analyses ignore it. The two `.f32` files are raw little-endian
float32 tensors containing exactly `224 * 224` values. Expected logits and
probabilities are JSON arrays of exactly 14 finite numbers. The PNG must not
contain alpha. Fixtures and the Python reference must be synthetic or otherwise
approved as non-sensitive.

The validator checks the fixed manifest, content paths, model size, ONNX opset,
absence of external data, input/output names, exact preprocessing tensor bytes,
finite output, and WASM parity. It rejects missing evidence. The current limits
are `1e-4` absolute logit error, `1e-3` relative logit error, and `1e-4`
absolute probability error. Validation also runs the model in Chromium WASM and
attempts WebGPU when the validation browser exposes it. The validator launches
new-headless Chromium (`channel: "chromium"`, `--enable-unsafe-webgpu`), so a
machine with a GPU gets a real adapter; the reason for any disabled WebGPU is
printed as `WebGPU disabled: …`. A release enables WebGPU
only when its logits are within `1e-3` absolute difference of WASM; otherwise
the manifest pins that release to WASM. For V2 and V3, WebGPU must also meet the heatmap parity limit of `1e-3`; the WASM heatmap must match the PyTorch fixture within `1e-4`. Unavailable WebGPU is recorded as disabled, never as a successful parity measurement.

## Local workflow

Docker Desktop or Podman must be installed and available on `PATH` for the local
Supabase commands.

```bash
npx supabase db push --local
npx supabase test db
npm test
npm run test:model:browser
npm run model:validate -- --bundle model-input/<release-id>
```

Point the operator variables at local Supabase, then stage and activate using
the revision returned by `model:status`:

```bash
npm run model:stage -- --bundle model-input/<release-id>
npm run model:status
npm run model:activate -- --release <release-id> --expected-revision 0 --reason "Initial local release"
```

Staging uploads content-addressed objects without upsert, verifies their hashes,
runs remote WASM smoke inference, and registers an inactive candidate. It never
changes the active pointer.

## Production promotion

Set these only in the operator shell or an uncommitted operator environment:

```dotenv
MODEL_REGISTRY_SUPABASE_URL=https://<production-ref>.supabase.co
MODEL_REGISTRY_SERVICE_ROLE_KEY=<production-service-role-key>
MODEL_PUBLISHER_ACTOR=<operator-identity>
```

Do not add these values to Vercel. Vercel needs only the production project's
public URL and publishable key.

Use this order:

1. Complete the local workflow and activate the release locally.
2. Run `npx supabase db push --linked --dry-run`.
3. Review production Security and Performance Advisors and take a current
   database backup or dump.
4. Apply the additive migration with `npx supabase db push --linked`.
5. Run `npm run model:stage -- --bundle model-input/<release-id>` against
   production.
6. Deploy Vercel Production with `NEXT_PUBLIC_APP_BUILD` set to the deployment's
   immutable build identifier.
7. Read the current revision with `npm run model:status`.
8. Activate with `npm run model:activate -- --release <release-id>
   --expected-revision <revision> --reason "<change reference>"`.
9. Confirm `model:status` records the expected release and revision.

Activation locks the slot, rejects stale revisions, appends history, reads the
pointer back, and runs Node and headless-Chromium WASM smoke inference. If that
post-activation validation fails and a previous release exists, the CLI restores
the previous pointer and records the automatic rollback. If the failed release
was the first activation, the compensating revision restores the slot to no
active release. Complete validation evidence is still mandatory before any
activation.

For a deliberate rollback:

```bash
npm run model:rollback -- --to <previous-release-id> --expected-revision <revision> --reason "<incident reference>"
```

Never activate a bundle with missing evidence, failed parity, an unsupported manifest, or an artifact over 50 MiB. Keep V1 artifacts registered for rollback. Rollback changes only the active pointer; existing immutable V1/V2/V3 analyses and their maps remain unchanged.

## V3 export and migration

`20261029120000_class_activation_maps.sql` allows contract 3, pins the V3 manifest descriptor, accepts 2744-value maps with the V3 method for V3 analyses, and maps schemaVersion 3 in `register_model_release`. V1 and V2 rows and their constraints are unchanged. `export-validation.json` records `classActivationFixtureSha256` instead of `attentionFixtureSha256`.

## V2 export and migration

Follow [the exporter instructions](../model-export/README.md). V2 additionally requires `export-validation.json` with successful ONNX checker, deterministic PyTorch attention fixture checksum, official checkpoint hash, and logit parity evidence. Keep checkpoints, synthetic fixtures and generated artifacts in ignored directories.

`20260922163225_attention_contract_hardening.sql` is the additive repair for both empty and partially applied earlier attention migrations. It requires valid maps for V2, rejects maps for V1, preserves the six-argument completion wrapper, and removes the obsolete renamed implementation. Run all pgTAP tests and database advisors before promotion. Production migration and activation are separate operator actions; local verification never authorizes production automatically.
