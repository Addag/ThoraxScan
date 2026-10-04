---
node_type: schema
universe: live
status: verified
audited: 2026-10-03
snapshot: main @ 2210fa5 + working tree
---

# Design tokens

ThoraxScan’s current visual token layer is the CSS custom-property and class contract in globals.css, plus Tailwind v4 utilities for the surfaces migrated so far.

## Why this shape

The landing, authentication, administration, role dashboards, and activity surfaces share colors, typography, borders, status treatments, and responsive rules through one stylesheet.

## Shape

Glass hierarchy uses three shared surface tokens in [globals.css](<../../../src/app/globals.css:3>): `--glass-shell` for darker navigation, `--glass-surface` with `--glass-shadow` for primary panels, and `--glass-inset` with an inset highlight for nested cards. Workspace cards, administrator application cards, model status cards, and statistic tiles omit additional backdrop blur; primary panels retain it. Selected navigation/role colors and image-frame backgrounds remain separate. Verified against the working tree on 2026-09-12.

Core variables include canvas, app background, surfaces, borders, text, brand blue, success green, warning yellow, and purple accent in [globals.css](<../../../src/app/globals.css:3>). The shared Settings surface styles its category rows, panels, status treatments, switch, and action gradient with Tailwind utilities in [settings-form.tsx](<../../../src/components/settings/settings-form.tsx>); the dark/light activity-image frames it toggles remain in [globals.css](<../../../src/app/globals.css:3616>).

Hand-written rules sit inside `@layer components` in [globals.css](<../../../src/app/globals.css:41>) so Tailwind utilities override them; unlayered CSS would beat every utility. `@theme inline` exposes `background`, `foreground`, and `brand` colors to utilities in [globals.css](<../../../src/app/globals.css:31>); other tokens are used as `bg-(--name)` / `text-(--name)`. Utility-styled surfaces: the shared role shell in [app-shell.tsx](<../../../src/components/app-shell.tsx>) and [app-sidebar.tsx](<../../../src/components/app-sidebar.tsx>), [EmptyState](<../../../src/components/empty-state.tsx>), the [activity button classes](<../../../src/components/activities/activity-button.ts>) and [primary button utilities](<../../../src/components/primary-button.ts>), the administrator approval surface (including the Professor application review form), Learning Mode with the built-in X-ray library, and the shared Settings surface. Utilities use `max-[Npx]:` variants, which exclude the boundary pixel that the legacy `max-width` queries include. The landing, auth, workspace, and activity-page styles remain in globals.css.

## Connected to

The [landing surface](landing-surface.md), [authentication surface](auth-surface.md), [Administrator approval surface](administrator-approval-surface.md), [Shared settings surface](shared-settings-surface.md), [Role workspace surfaces](../learning/role-workspace-surface.md), [Activity](../learning/activity.md), Brand, and static assets.

## If you change this

### Hits

- Every current public and authenticated visual surface using the changed variable, class, or utility-styled component.
- Visual regression and accessibility checks.

### Does not hit

- Auth data, role routing, database schema, or inference behavior.

## Surfaces

Global CSS, browser rendering, and visual QA.

## See

[globals.css](<../../../src/app/globals.css:3>)

Authentication screens now use Tailwind utilities in [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>) and [auth-form.tsx](<../../../src/components/auth/auth-form.tsx>); the shared auth-eyebrow, field-error, and role-page rules remain in globals.css.

