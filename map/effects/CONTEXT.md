---
node_type: effect
universe: live
status: live
audited: 2026-08-17
snapshot: main @ 1e5cbf8
---

# Change-impact index

Use this catalog before editing. Open the named cards and their source files; do not treat this page as a replacement for the source.

| Change target | Open first | Hits | Does not hit |
|---|---|---|---|
| Profile fields or role values | [Profile](../objects/identity/profile.md), [AppRole](../objects/identity/app-role.md), [profile schema](../objects/runtime/supabase-profile-schema.md) | Migration, trigger, TypeScript types, registration, login, role guards, role pages | Landing styling, password recovery, future activities |
| Browser/server Supabase client or cookies | [auth session](../objects/identity/auth-session.md), [auth boundary](../objects/runtime/supabase-auth-boundary.md), [session process](../processes/session-protection.md) | Proxy refresh, protected access, confirmation, login, logout, deployment environment | Public copy and static X-ray asset |
| Registration or login form fields | [authentication surface](../objects/ui/auth-surface.md), [registration](../processes/registration.md), [login and role routing](../processes/login-and-role-routing.md) | Field validation, server action names, role selection, messages, profile lookup | Planned Workspace records |
| Confirmation or reset destination | [confirmation and recovery](../processes/confirmation-and-recovery.md), [auth session](../objects/identity/auth-session.md) | Auth action redirect URLs, safe destination rules, reset-page claims, login messaging | Profile schema and role values |
| Student/professor placeholder surface | [role workspace surface](../objects/learning/role-workspace-surface.md), [AppRole](../objects/identity/app-role.md) | Protected pages, role guard, shared placeholder, logout surface | Planned LMS workflows until routes and records are implemented |
| Landing/auth visual system | [landing surface](../objects/ui/landing-surface.md), [auth surface](../objects/ui/auth-surface.md), [design tokens](../objects/ui/design-tokens.md) | Current public/auth layouts, assets, accessibility and visual checks | Auth data, SQL, inference runtime |
| Static X-ray sample | [X-ray sample asset](../objects/ui/xray-sample-asset.md) | Landing and auth image rendering | Future image input, preprocessing, model, and storage |
| Planned LMS record or access rule | Ghost entries in [object index](../objects/_index.md), then [technical design](../TECHNICAL_DESIGN_DOCUMENT.md) | Future migrations, RLS, server routes, role surfaces, and workflow cards after implementation | Current auth/profile behavior unless the new feature changes its contract |
| Planned model, labels, thresholds, or heatmap | Ghost entries in [object index](../objects/_index.md), then [technical design](../TECHNICAL_DESIGN_DOCUMENT.md) | Future model assets, browser preprocessing, inference UI, parity tests, and privacy verification | Current auth/profile and static presentation asset |

## Human check

After a source change, re-open the affected object/process card and verify both the Hits and Does not hit statements against the new source. Add a new effect row only when a first-order dependency is real.
