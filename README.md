# ThoraxScan

ThoraxScan is a professor-guided learning platform for chest X-ray
interpretation, built for Radiologic Pathology and BS Radiologic Technology
students. Professors run private workspaces and publish activities built on
de-identified teaching cases. Students submit their interpretations and, once
they have submitted, receive AI-assisted feedback and the professor's
evaluation.

> **Educational use only.** ThoraxScan is not a diagnostic tool and has not been
> clinically validated. It does not replace a radiologist and must not be used
> for patient care.

## What it does

- **Students** join workspaces with an invitation code, complete activities,
  practise in Learning Mode with the active model, read the attention-map guide,
  and manage their account settings.
- **Professors** apply for approval, then create workspaces and activities from
  their own uploads or the built-in CheXpert case library. They review
  submissions, release feedback, view analytics, and can use Learning Mode too.
- **Administrators** approve Professor applications and manage other
  administrators from `/admin`. Administrator is a separate capability, not a
  registration role (see [Bootstrap the first administrator](#bootstrap-the-first-administrator)).

## How it works

```text
Browser:  image -> grayscale, resize -> ONNX Runtime Web (WebGPU, else WASM)
                -> 14 probabilities + per-finding class activation maps
Supabase: Auth, Postgres with row-level security, Storage
                -> workspaces, activities, submissions, evaluations, model registry
```

Model inference runs in the browser. Learning Mode results stay in memory.
Activity analyses are saved once through an authorized RPC, and Students see
them only after they submit and the professor releases feedback. The active
model is read from a Supabase registry slot, so a model can be replaced without
redeploying the app (see [The model](#the-model)).

## Tech stack

### Hardware

| Where | What runs there |
|---|---|
| Training workstation (NVIDIA GPU, CUDA 12.8) | Model training, ONNX export, and PyTorch-to-ONNX parity checks |
| The user's device | Model inference in the browser: WebGPU on the GPU when a release enables it, otherwise WebAssembly on the CPU. Speed depends on the device. |
| Vercel | Next.js server rendering, Server Actions, and Route Handlers |
| Supabase | Postgres, Auth, and Storage |

### Software and services

- **Web app:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4,
  on Node.js
- **Hosting:** Vercel, with Vercel Analytics and Speed Insights
- **Backend:** Supabase Postgres (row-level security, RPCs, triggers), Auth, and
  Storage
- **Bot protection:** Cloudflare Turnstile
- **In-browser AI:** ONNX Runtime Web (WebGPU, WebAssembly fallback)
- **Model training and export:** Python 3.14, PyTorch with CUDA, timm, ONNX
- **Testing:** Vitest for unit tests, Vitest Browser with Playwright and
  Chromium for model tests, pgTAP for the database

### npm dependencies

Versions are pinned in [`package.json`](package.json); `package-lock.json`
records the full tree.

| Package | Used for |
|---|---|
| `next`, `react`, `react-dom` | The web app |
| `@supabase/supabase-js`, `@supabase/ssr` | Supabase client and cookie sessions |
| `onnxruntime-web` | In-browser inference; pinned to 1.27.0 (see `prepare:ort` below) |
| `sharp` | Server-side checks on uploaded case images |
| `@marsidev/react-turnstile` | The Turnstile CAPTCHA widget |
| `@vercel/analytics`, `@vercel/speed-insights` | Usage and performance metrics |
| `tailwindcss`, `@tailwindcss/postcss` | Styling (dev) |
| `typescript`, `eslint`, `eslint-config-next` | Types and linting (dev) |
| `vitest`, `@vitest/browser-playwright`, `vitest-browser-react`, `playwright` | Tests (dev) |
| `supabase` | Supabase CLI for the local stack and migrations (dev) |
| `tsx`, `tus-js-client` | The model release CLI and its resumable uploads (dev) |

### Python dependencies

[`model-export/requirements.txt`](model-export/requirements.txt) pins the
packages installed directly: `torch` and `torchvision` (CUDA 12.8 builds),
`timm`, `safetensors`, `numpy`, `pandas`, `pillow`, `opencv-python`,
`scikit-learn`, `scipy`, `matplotlib`, `tqdm`, `onnx`, `onnxruntime-gpu`,
`onnxsim`, and `onnxscript`.
[`model-export/requirements-lock.txt`](model-export/requirements-lock.txt)
records every package in the environment with its exact version. Python runs
only offline; the deployed app does not use it.

## Getting started

Prerequisites: Node.js 20.9 or later, and Docker for the local Supabase stack.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the uncommitted root `.env` with the local Turnstile test secret
   (see [Configure CAPTCHA protection](#configure-captcha-protection)). Local
   Supabase reads it on start because `supabase/config.toml` enables CAPTCHA.

3. Start local Supabase and apply the migrations:

   ```bash
   npx supabase start
   ```

   ```bash
   npx supabase db reset
   ```

4. Copy `.env.example` to `.env.local`. Set `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the output of
   `npx supabase status`, and use the Turnstile test site key.

5. Run the development server:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

`npm run dev`, `npm run build`, and the browser model tests first run
`prepare:ort`. It copies the ONNX Runtime WebAssembly files into
`public/ort/1.27.0` and fails unless `onnxruntime-web` is exactly 1.27.0, so
update the script when you upgrade that package.

A fresh local database has no active model. AI feedback and Learning Mode
analysis stay unavailable until you validate, stage, and activate a release (see
[`docs/model-releases.md`](docs/model-releases.md)).

## Environment variables

All variables are listed in [`.env.example`](.env.example).

| Variable | Purpose | Where it is set | Secret |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `.env.local`, Vercel | No |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key | `.env.local`, Vercel | No |
| `NEXT_PUBLIC_SITE_URL` | Base URL for auth email redirects | `.env.local`, Vercel | No |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key | `.env.local`, Vercel | No |
| `NEXT_PUBLIC_APP_BUILD` | Build label recorded with AI analyses | `.env.local`, Vercel | No |
| `SUPABASE_AUTH_CAPTCHA_SECRET` | Turnstile secret for local Supabase Auth | Root `.env` only | Yes |
| `MODEL_REGISTRY_SUPABASE_URL` | Target project for the model release CLI | Operator shell only | No |
| `MODEL_REGISTRY_SERVICE_ROLE_KEY` | Service-role key for the model release CLI | Operator shell only | Yes |
| `MODEL_PUBLISHER_ACTOR` | Name recorded on model releases and activations | Operator shell only | No |

In hosted Supabase, the Turnstile secret is entered in the dashboard, not set as
a variable. Never put the service-role key in Vercel or in a `NEXT_PUBLIC_`
variable.

## Configure CAPTCHA protection

ThoraxScan uses Cloudflare Turnstile with Supabase Auth for registration,
password login, and password-recovery requests.

1. Create a managed Turnstile widget in Cloudflare. Restrict the production
   widget to the deployed ThoraxScan hostname; do not allow `localhost` on the
   production widget.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in the application hosting environment.
   This site key is public and is rendered in the browser.
3. In Supabase, open **Authentication > Bot and Abuse Protection**, select
   Turnstile, enter the widget secret, and enable CAPTCHA protection. Store the
   secret only in Supabase; never expose it through a `NEXT_PUBLIC_` variable.

For local browser checks, Cloudflare provides an always-pass test site key:

```dotenv
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
```

When running the local Supabase stack, pair it with Cloudflare's matching test
secret in the uncommitted root `.env` file:

```dotenv
SUPABASE_AUTH_CAPTCHA_SECRET=1x0000000000000000000000000000000AA
```

Do not use either test key in production. Deploy the CAPTCHA-aware application
before enabling CAPTCHA in hosted Supabase; otherwise signup, login, and
password recovery will reject requests without a token. If rollback is needed,
disable CAPTCHA in Supabase before rolling back the application.

## Bootstrap the first administrator

Administrator is a separate capability, not a public registration role. After
the first administrator has registered and confirmed their email, run this once
in the hosted production project's Supabase SQL Editor. Audit the target project
and take a current backup before changing production data:

```sql
insert into public.platform_admins (user_id)
select auth_user.id
from auth.users as auth_user
where lower(auth_user.email) = lower('administrator@example.com')
  and auth_user.email_confirmed_at is not null
on conflict (user_id) do nothing;
```

Replace `administrator@example.com`, then verify the result:

```sql
select profile.display_name, auth_user.email, administrator.created_at
from public.platform_admins as administrator
join public.profiles as profile on profile.id = administrator.user_id
join auth.users as auth_user on auth_user.id = administrator.user_id;
```

The administrator then selects **Administrator** on the normal login page and is routed to `/admin`.

After the first administrator exists, add or remove others from the
**Administrators** section of `/admin`. Administrators cannot remove themselves,
so at least one always remains.

## The model

The live hosted release is `tinyvit-v7-nih-cam-ecm-possible85-sr320-20261030.1`:
a TinyViT-11M classifier trained on CheXpert and NIH ChestX-ray14 and distilled
from a FastViT teacher. It predicts the 14 CheXpert labels in the fixed order
defined in [`src/lib/inference/contract.ts`](src/lib/inference/contract.ts).

The live release follows model contract version 3: a grayscale 224×224 input,
14 logits, and one 14×14 class activation map per label. Weights and thresholds
can change without an app deployment; a contract change needs one.

A small server-side view detector also rejects lateral images in Professor
activity uploads. [`docs/models.md`](docs/models.md) documents every model:
all nine training runs, all fifteen release bundles, the view detector, and the
models used only during development.

Releases move through three places:

1. [`model-export/`](model-export/) holds the Python exporters that turn a
   trained PyTorch checkpoint into ONNX plus validation fixtures.
2. The ignored `model-input/<release-id>/` folder holds each release bundle.
3. The operator CLI validates and publishes a bundle:

   ```bash
   npm run model:validate -- --bundle "model-input/<release-id>"
   ```

   `model:stage`, `model:activate`, `model:status`, and `model:rollback` follow
   the same pattern.

See [`docs/model-releases.md`](docs/model-releases.md) for the contract and the
release procedure, and
[`map/objects/inference/model-training.md`](map/objects/inference/model-training.md)
for the training history and evaluation results.

## Verification

```bash
npm test
npm run test:model:browser
npm run lint
npm run build
```

Before the first browser model test, install the Playwright browser:

```bash
npx playwright install chromium
```

Database behavior is covered by pgTAP tests in `supabase/tests/database`. Run
them against the local stack:

```bash
npx supabase test db
```

## Deployment

Vercel Production uses the hosted Supabase project's public URL and publishable
key. That hosted project is production; there is no preview or staging
project, so development and migration testing happen on local Supabase.

Before applying a migration to production, run a linked dry run, review the
Supabase Security and Performance Advisors, and take a current database backup.

Model releases are developed against local Supabase and promoted to the hosted
production project with the operator-only CLI. See
[`docs/model-releases.md`](docs/model-releases.md). Model publisher credentials
must never be configured in Vercel.

Production: [https://thoraxscan.com](https://thoraxscan.com)

## Project structure

| Path | Contents |
|---|---|
| `src/` | Next.js app routes, components, and libraries (inference, Supabase, case library) |
| `supabase/` | Config, migrations, auth email templates, and pgTAP tests |
| `scripts/` | Model release CLI, ONNX Runtime asset copy, case library import, guide rendering |
| `model-export/` | Python model exporters and their tests |
| `model-input/` | Ignored local release bundles |
| `public/` | Static assets, including the built-in CheXpert images and ONNX Runtime files |
| `docs/` | Operations documentation |
| `map/` | Source-backed system map and the original planning documents |

## Further documentation

- [`map/CLAUDE.md`](map/CLAUDE.md): the system map, covering objects,
  processes, schema, and what a change affects.
- [`docs/models.md`](docs/models.md): every model, with its data, results,
  and release history.
- [`docs/model-releases.md`](docs/model-releases.md): the model contract and
  release operations.
- [`supabase/README.md`](supabase/README.md): Supabase environments and
  database operations.
- [`model-export/README.md`](model-export/README.md): exporting a checkpoint to
  ONNX.
- [`map/PRODUCT_REQUIREMENTS_DOCUMENT.md`](map/PRODUCT_REQUIREMENTS_DOCUMENT.md),
  [`map/TECHNICAL_DESIGN_DOCUMENT.md`](map/TECHNICAL_DESIGN_DOCUMENT.md), and
  [`map/DESIGN.md`](map/DESIGN.md): the original product and design references.

## Credits and license

The built-in case library uses images from
[CheXpert](https://stanfordmlgroup.github.io/competitions/chexpert/) (Irvin,
Rajpurkar et al., 2019). The model was trained on CheXpert and NIH
ChestX-ray14. Public redistribution permission for the bundled images has not
been confirmed; see
[`src/lib/xray-library/README.md`](src/lib/xray-library/README.md). The code
license does not grant rights to the dataset images.

Code © 2026 Siegfred A. Addag, Luke Andrew S. Casas, Ma. Kyle Nicole P. Leus, Aldwin Josh D. Perez. Licensed under the
[MIT License](LICENSE). Dataset images and trained model weights are subject to
their original dataset terms and are not covered by this license.
