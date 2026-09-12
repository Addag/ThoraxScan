---
node_type: schema
universe: live
status: verified
audited: 2026-08-30
snapshot: main @ 7aed17a + working tree
---

# Design tokens

ThoraxScan’s current visual token layer is the CSS custom-property and class contract in globals.css.

## Why this shape

The landing, authentication, administration, role dashboards, and activity surfaces share colors, typography, borders, status treatments, and responsive rules through one stylesheet.

## Shape

Glass hierarchy uses three shared surface tokens in [globals.css](<../../../src/app/globals.css:3>): `--glass-shell` for darker navigation, `--glass-surface` with `--glass-shadow` for primary panels, and `--glass-inset` with an inset highlight for nested cards. Workspace cards, administrator application cards, model status cards, and statistic tiles omit additional backdrop blur; primary panels retain it. Selected navigation/role colors and image-frame backgrounds remain separate. Verified against the working tree on 2026-09-12.

Core variables include canvas, app background, surfaces, borders, text, brand blue, success green, warning yellow, and purple accent in [globals.css](<../../../src/app/globals.css:3>). The shared Settings surface adds responsive category rows, panels, status treatments, a switch, action gradient, and dark/light activity-image frames in [the settings styles](<../../../src/app/globals.css:3746>).

## Connected to

The [landing surface](landing-surface.md), [authentication surface](auth-surface.md), [Administrator approval surface](administrator-approval-surface.md), [Shared settings surface](shared-settings-surface.md), [Role workspace surfaces](../learning/role-workspace-surface.md), [Activity](../learning/activity.md), Brand, and static assets.

## If you change this

### Hits

- Every current public and authenticated visual surface using the changed variable or class.
- Visual regression and accessibility checks.

### Does not hit

- Auth data, role routing, database schema, or inference behavior.

## Surfaces

Global CSS, browser rendering, and visual QA.

## See

[globals.css](<../../../src/app/globals.css:3>)
