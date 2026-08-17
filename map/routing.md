---
node_type: catalog
subject: ThoraxScan repository
status: live
snapshot: working tree @ 2026-08-17
audited: 2026-08-17
---

# ThoraxScan system map

This is a source-backed map of the ThoraxScan application repository one level above this folder. The subject tree is the source of truth; this map routes to it and records first-order change impact.

## Where to go

| Question | Open |
|---|---|
| How do I walk this map? | [CONTEXT.md](CONTEXT.md) |
| What is X? | [objects/_index.md](objects/_index.md), then the linked card |
| What actually runs? | [processes/CONTEXT.md](processes/CONTEXT.md) |
| What schema is live? | [objects/runtime/supabase-profile-schema.md](objects/runtime/supabase-profile-schema.md) plus [Workspace](objects/learning/workspace.md), [Membership](objects/learning/workspace-membership.md), and [Invitation Code](objects/learning/invitation-code.md) |
| What else moves if I change X? | [effects/CONTEXT.md](effects/CONTEXT.md) |
| What is planned but not wired? | The ghost cards in [objects/_index.md](objects/_index.md) |
| What are the product/design references? | The six original planning/design documents in this folder; they are references, not runtime source |

## Universes

- live: implemented in the repository and safe to cite for current behavior.
- leftover: still present but no longer the main path; touch only when that path is in scope.
- ghost: named in plans or UI copy but not wired in the repository; do not implement against the card alone.

## Name collisions

- Profile means the public.profiles row plus the TypeScript projection used by the app.
- Role workspace surface covers the live Student and Professor dashboard/detail routes; Workspace means the professor-owned learning-space record shared by both roles.
- X-ray sample means the static presentation image; it is not the planned inference input pipeline.
- Attention Heatmap is planned explanatory output; its current appearance in copy and design documents is not implementation evidence.

## Source rule

Cards cite the smallest source file that owns the fact. Code, migrations, and configuration outrank planning documents. A ghost card records a documented shape only; it is not an implementation specification.
