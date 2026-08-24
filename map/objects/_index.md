---
node_type: catalog
status: live
audited: 2026-08-24
snapshot: main @ 46c18c1 + working tree
---

# Object index

One line per important noun. live cards are source-backed; ghost entries are documented or named but not wired.

## Identity

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Profile | live | [profile.md](identity/profile.md) | public.profiles plus the TypeScript projection |
| AppRole | live | [app-role.md](identity/app-role.md) | TypeScript union and SQL role constraint |
| Platform administrator | live | [platform-administrator.md](identity/platform-administrator.md) | public.platform_admins and the protected administrator route |
| Professor application | live | [professor-application.md](identity/professor-application.md) | public.professor_applications and review RPC |
| Auth session and claims | live | [auth-session.md](identity/auth-session.md) | Supabase adapters, proxy, and auth routes |

## Learning

| Noun | Universe | Card or source stub | Source |
|---|---|---|---|
| Role workspace surface | live | [role-workspace-surface.md](learning/role-workspace-surface.md) | Student and Professor workspace dashboards and detail pages |
| Workspace | live | [workspace.md](learning/workspace.md) | public.workspaces and student workspace projections |
| Workspace membership | live | [workspace-membership.md](learning/workspace-membership.md) | public.workspace_members and its RLS helpers |
| Invitation code | live | [invitation-code.md](learning/invitation-code.md) | public.invitation_codes and redemption RPC |
| X-ray case | live | [xray-case.md](learning/xray-case.md) | public.xray_cases, private activity-cases bucket, and signed upload/read flow |
| Activity | live | [activity.md](learning/activity.md) | public.activities, private reference evaluation, Server Actions, and role routes |
| AI analysis | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L320) |
| Student submission | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L321) |
| AI feedback release | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L322) |
| Faculty evaluation | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L323) |
| Analytics | ghost | stub | [application flow reference](../thoraxscan-app-flow.md#L48) |

## Inference

| Noun | Universe | Card or source stub | Source |
|---|---|---|---|
| Model release / ONNX artifact | live | [model-release.md](inference/model-release.md) | Immutable registry row and content-addressed Storage objects |
| Active model slot | live | [active-model-slot.md](inference/active-model-slot.md) | One seeded pointer and append-only activation history per Supabase instance |
| Model manifest, labels, and thresholds | live | [model-manifest-configuration.md](inference/model-manifest-configuration.md) | ModelManifestV1 parser and publisher-generated manifest |
| Browser inference runtime | live | [browser-inference-runtime.md](inference/browser-inference-runtime.md) | Active resolver, verified session cache, provider fallback, and analyzeImage library |
| Image input and preprocessing tensor | live | [preprocessing-tensor.md](inference/preprocessing-tensor.md) | Browser decode and pure version 1 preprocessing transform |
| Transient prediction result | live | [prediction-result.md](inference/prediction-result.md) | In-memory InferenceResult; not persisted or rendered by a product page |
| Attention heatmap | ghost | stub | [technical design](../TECHNICAL_DESIGN_DOCUMENT.md#L250) |
| Local Learning Mode image | ghost | stub | [product requirements](../PRODUCT_REQUIREMENTS_DOCUMENT.md#L84) |

## UI

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Landing surface | live | [landing-surface.md](ui/landing-surface.md) | src/app/page.tsx |
| Authentication surface | live | [auth-surface.md](ui/auth-surface.md) | auth pages, layout, form, and actions |
| Administrator approval surface | live | [administrator-approval-surface.md](ui/administrator-approval-surface.md) | /admin, review actions, and administrator shell |
| Design tokens | live | [design-tokens.md](ui/design-tokens.md) | src/app/globals.css |
| X-ray sample asset | live | [xray-sample-asset.md](ui/xray-sample-asset.md) | public/images/xray-sample.png |

## Runtime and schemas

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Profiles database schema | live | [supabase-profile-schema.md](runtime/supabase-profile-schema.md) | Supabase migration |
| Supabase auth boundary | live | [supabase-auth-boundary.md](runtime/supabase-auth-boundary.md) | client/server adapters and environment contract |
