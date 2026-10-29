---
node_type: catalog
subject: ThoraxScan repository
status: live
snapshot: main @ 76f6977 + working tree
audited: 2026-10-27
---

# ThoraxScan system map

This is a source-backed map of the ThoraxScan application repository one level above this folder. The subject tree is the source of truth; this map routes to it and records first-order change impact.

## Where to go

| Question | Open |
|---|---|
| How do I walk this map? | [CONTEXT.md](CONTEXT.md) |
| What is X? | [objects/_index.md](objects/_index.md), then the linked card |
| What actually runs? | [processes/CONTEXT.md](processes/CONTEXT.md) |
| What privacy and consent contracts are live? | [Privacy policy surface](objects/ui/privacy-policy.md), [Legal consent](objects/runtime/legal-consent.md), [consent recording](processes/privacy-consent-recording.md), and [privacy change effects](effects/CONTEXT.md) |
| What schema is live? | [Profile schema](objects/runtime/supabase-profile-schema.md), [Account settings](objects/runtime/account-settings.md), [Platform administrator](objects/identity/platform-administrator.md), [Professor application](objects/identity/professor-application.md), [Workspace](objects/learning/workspace.md), [Membership](objects/learning/workspace-membership.md), [Invitation Code](objects/learning/invitation-code.md), [Activity](objects/learning/activity.md), [X-ray case](objects/learning/xray-case.md), [Model release](objects/inference/model-release.md), and [Active model slot](objects/inference/active-model-slot.md) |
| How was the model trained, and on which views? | [Model training](objects/inference/model-training.md) |
| How is a model replaced? | [Model validation](processes/model-validation.md), [staging](processes/model-staging.md), [activation](processes/model-activation.md), and [rollback](processes/model-rollback.md) |
| How do Students save and finalize responses? | [Student submission](objects/learning/student-submission.md), then [submission workflow](processes/student-submission.md) |
| How are activities published and viewed? | [Activity authoring/publication](processes/activity-authoring-publication.md), then [Student activity viewing](processes/student-activity-view.md) |
| How are Professor accounts approved? | [Professor application](objects/identity/professor-application.md), then [application review](processes/professor-application-review.md) |
| How are Student and Professor settings updated? | [Shared settings surface](objects/ui/shared-settings-surface.md), [Account settings](objects/runtime/account-settings.md), then [settings update](processes/account-settings-update.md) |
| What protects the administrator dashboard? | [Platform administrator](objects/identity/platform-administrator.md) and [Administrator approval surface](objects/ui/administrator-approval-surface.md) |
| How do Students and Professors practice with the active model? | [Student and Professor Learning Mode](objects/ui/student-learning-mode-surface.md), then [Learning Mode inference](processes/student-learning-mode-inference.md) |
| Where is the educational attention-map guide? | [Attention Maps surface](objects/ui/attention-maps-surface.md) |
| Where do built-in practice/activity images come from? | [Built-in X-ray library](objects/learning/built-in-xray-library.md) |
| What else moves if I change X? | [effects/CONTEXT.md](effects/CONTEXT.md) |
| What is planned but not wired? | The ghost cards in [objects/_index.md](objects/_index.md) |
| What are the product/design references? | The six original planning/design documents in this folder; they are references, not runtime source |

## Universes

- live: implemented in the repository and safe to cite for current behavior.
- leftover: still present but no longer the main path; touch only when that path is in scope.
- ghost: named in plans or UI copy but not wired in the repository; do not implement against the card alone.

## Name collisions

- Profile means the public.profiles row plus the TypeScript projection used by the app.
- AppRole remains student | professor. Administrator is a login portal backed by a separate platform_admins capability, not a profile or workspace-membership role.
- Professor application status gates Professor workspace access; it does not replace the Professor profile role.
- Role workspace surface covers the live Student and Professor workspace/activity routes; Workspace means the professor-owned tenant shared by both roles.
- X-ray case means the live private activity object/audit row. X-ray sample means the unrelated static public presentation image. Built-in X-ray library means the bundled CheXpert gallery; Learning Mode keeps a selection in browser memory, while Professor activity authoring uploads a selection through the normal signed case flow.
- Attention Heatmap covers V2 global attention rollout (legacy) and V3 per-finding class activation maps ("finding heatmaps"), both stored in `ai_analyses.attention_map` and told apart by `attention_method`: transient in Learning Mode, persisted and authorization-gated for activities. V1 remains unavailable. See [attention heatmap](objects/inference/attention-heatmap.md).
- Browser inference runtime is consumed by Student Learning Mode and the activity analysis boundary; Learning Mode results remain transient while activity results persist only through the authorized analysis RPC.

## Source rule

Cards cite the smallest source file that owns the fact. Code, migrations, and configuration outrank planning documents. A ghost card records a documented shape only; it is not an implementation specification.
