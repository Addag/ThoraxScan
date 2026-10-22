---
node_type: catalog
status: live
audited: 2026-09-29
snapshot: main @ 6af6c16
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
| AI analysis | live | [ai-analysis.md](learning/ai-analysis.md) | `public.ai_analyses`, analysis RPCs, and activity AI components |
| [Student submission](learning/student-submission.md) | live | object | [submission workflow](../processes/student-submission.md) |
| AI feedback release | live | [ai-feedback-release.md](learning/ai-feedback-release.md) | `public.ai_feedback_releases`, submission trigger, and authorized feedback RPC |
| Faculty evaluation | live | [faculty-evaluation.md](learning/faculty-evaluation.md) | immutable Professor review and Student projection |
| Built-in X-ray library | live | [built-in-xray-library.md](learning/built-in-xray-library.md) | Bundled CheXpert `valid` JPEGs, `cases.json` manifest, and shared gallery component |
| Bell notification | live | [notification.md](learning/notification.md) | Derived due/submission feed, `public.notification_reads`, and popover bell |
| Analytics | ghost | stub | [application flow reference](../thoraxscan-app-flow.md#L48) |

## Inference

| Noun | Universe | Card or source stub | Source |
|---|---|---|---|
| Model training (official retrain v1) | live | [model-training.md](inference/model-training.md) | External `Official_retrain_v1` scripts, checkpoint, and CheXpert CSVs |
| Model release / ONNX artifact | live | [model-release.md](inference/model-release.md) | Immutable registry row and content-addressed Storage objects |
| Active model slot | live | [active-model-slot.md](inference/active-model-slot.md) | One seeded pointer and append-only activation history per Supabase instance |
| Model manifest, labels, and thresholds | live | [model-manifest-configuration.md](inference/model-manifest-configuration.md) | V1/V2 manifest parser and publisher-generated manifest |
| Browser inference runtime | live | [browser-inference-runtime.md](inference/browser-inference-runtime.md) | Active resolver, verified session cache, provider fallback, and analyzeImage library |
| Image input and preprocessing tensor | live | [preprocessing-tensor.md](inference/preprocessing-tensor.md) | Browser decode and pure version 1 preprocessing transform |
| Transient prediction result | live | [prediction-result.md](inference/prediction-result.md) | In-memory `InferenceResult`, adapted into immutable activity analysis payloads |
| Attention heatmap | live | [attention-heatmap.md](inference/attention-heatmap.md) | V2 global attention output, persisted for released activity analyses and transient in Learning Mode |
| Local Learning Mode image | live | [local-learning-mode-image.md](learning/local-learning-mode-image.md) | Student Learning Mode analyzer and transient browser state |

## UI

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Landing surface | live | [landing-surface.md](ui/landing-surface.md) | src/app/page.tsx |
| Authentication surface | live | [auth-surface.md](ui/auth-surface.md) | auth pages, layout, form, and actions |
| Privacy policy surface | live | [privacy-policy.md](ui/privacy-policy.md) | public `/privacy-policy` page and shared legal navigation |
| Terms and conditions surface | live | [terms.md](ui/terms.md) | public `/terms` page, registration agreement, and signup metadata version/date |
| Administrator approval surface | live | [administrator-approval-surface.md](ui/administrator-approval-surface.md) | /admin, review actions, and administrator shell |
| Shared settings surface | live | [shared-settings-surface.md](ui/shared-settings-surface.md) | Shared role-gated settings wrapper, form, and navigation |
| Design tokens | live | [design-tokens.md](ui/design-tokens.md) | src/app/globals.css |
| X-ray sample asset | live | [xray-sample-asset.md](ui/xray-sample-asset.md) | public/images/xray-sample.png |
| Student and Professor Learning Mode surfaces | live | [student-learning-mode-surface.md](ui/student-learning-mode-surface.md) | `/student/learning`, `/professor/learning`, and shared analyzer component |

## Runtime and schemas

| Noun | Universe | Card | Source of truth |
|---|---|---|---|
| Profiles database schema | live | [supabase-profile-schema.md](runtime/supabase-profile-schema.md) | Supabase migration |
| Account settings | live | [account-settings.md](runtime/account-settings.md) | Self-private settings table and atomic authenticated RPC |
| Supabase auth boundary | live | [supabase-auth-boundary.md](runtime/supabase-auth-boundary.md) | client/server adapters and environment contract |
| Legal consent record | live | [legal-consent.md](runtime/legal-consent.md) | `public.legal_consents` and consent RPCs |
