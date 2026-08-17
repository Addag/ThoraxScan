---
node_type: catalog
status: live
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Object index

One line per important noun. live cards are source-backed; ghost entries are documented or named but not wired.

## Identity

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Profile | live | [profile.md](identity/profile.md) | public.profiles plus the TypeScript projection |
| AppRole | live | [app-role.md](identity/app-role.md) | TypeScript union and SQL role constraint |
| Auth session and claims | live | [auth-session.md](identity/auth-session.md) | Supabase adapters, proxy, and auth routes |

## Learning

| Noun | Universe | Card or source stub | Source |
|---|---|---|---|
| Role workspace surface | live | [role-workspace-surface.md](learning/role-workspace-surface.md) | Student/professor pages and placeholder |
| Workspace | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L315) |
| Workspace membership | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L316) |
| Invitation code | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L317) |
| X-ray case | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L318) |
| Activity | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L319) |
| AI analysis | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L320) |
| Student submission | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L321) |
| AI feedback release | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L322) |
| Faculty evaluation | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L323) |

## Inference

| Noun | Universe | Card or source stub | Source |
|---|---|---|---|
| Image input and preprocessing tensor | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L146) |
| ONNX model artifact | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L115) |
| Label and threshold configuration | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L172) |
| Prediction result | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L199) |
| Attention heatmap | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L250) |
| Local Learning Mode image | ghost | stub | [product requirements](../PRODUCT_REQUIREMENTS_DOCUMENT.md#L84) |

## UI

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Landing surface | live | [landing-surface.md](ui/landing-surface.md) | src/app/page.tsx |
| Authentication surface | live | [auth-surface.md](ui/auth-surface.md) | auth pages, layout, form, and actions |
| Design tokens | live | [design-tokens.md](ui/design-tokens.md) | src/app/globals.css |
| X-ray sample asset | live | [xray-sample-asset.md](ui/xray-sample-asset.md) | public/images/xray-sample.png |

## Runtime and schemas

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Profiles database schema | live | [supabase-profile-schema.md](runtime/supabase-profile-schema.md) | Supabase migration |
| Supabase auth boundary | live | [supabase-auth-boundary.md](runtime/supabase-auth-boundary.md) | client/server adapters and environment contract |
