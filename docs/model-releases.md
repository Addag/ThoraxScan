# Model release operations

ThoraxScan uses immutable, content-addressed ONNX releases. Development and
initial validation use local Supabase. The existing linked hosted Supabase
project is production and has its own independent `thoraxscan-classifier`
pointer. A staged release is inactive until an explicit compare-and-swap
activation succeeds.

This foundation does not expose a model administration UI or connect inference
to a student page. It also does not save predictions.

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
├── preprocessing-reference.py
└── fixtures/
    ├── preprocessing-input.png
    ├── expected-tensor.f32
    ├── model-input.f32
    ├── expected-logits.json
    └── expected-probabilities.json
```

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
  "thresholdVersion": "thresholds-v1"
}
```

`thresholds.json` must contain all 14 labels in the exact contract order, each
with a finite value from 0 through 1. The two `.f32` files are raw little-endian
float32 tensors containing exactly `224 * 224` values. Expected logits and
probabilities are JSON arrays of exactly 14 finite numbers. The PNG must not
contain alpha. Fixtures and the Python reference must be synthetic or otherwise
approved as non-sensitive.

The validator checks the fixed manifest, content paths, model size, ONNX opset,
absence of external data, input/output names, exact preprocessing tensor bytes,
finite output, and WASM parity. It rejects missing evidence. The current limits
are `1e-4` absolute logit error, `1e-3` relative logit error, and `1e-4`
absolute probability error. Validation also runs the model in Chromium WASM and
attempts WebGPU when the validation browser exposes it. A release enables WebGPU
only when its logits are within `1e-3` absolute difference of WASM; otherwise
the manifest pins that release to WASM.

## Local workflow

Docker Desktop or Podman must be installed and available on `PATH` for the local
Supabase commands.

```bash
npx supabase db reset
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

Never activate a bundle with missing evidence, failed parity, an unsupported
manifest, or an artifact over 50 MiB. The CLI cannot confirm the absent initial
model's size, interpolation parity, hashes, or output parity until that bundle is
supplied.
