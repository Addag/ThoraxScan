---
node_type: schema
universe: live
status: verified
audited: 2026-08-20
snapshot: main @ ed26b07 + working tree
---

# Design tokens

ThoraxScan’s current visual token layer is the CSS custom-property and class contract in globals.css.

## Why this shape

The landing, authentication, administration, role dashboards, and activity surfaces share colors, typography, borders, status treatments, and responsive rules through one stylesheet.

## Shape

Core variables include canvas, app background, surfaces, borders, text, brand blue, success green, warning yellow, and purple accent in [globals.css](<../../../src/app/globals.css:3>).

## Connected to

The [landing surface](landing-surface.md), [authentication surface](auth-surface.md), [Administrator approval surface](administrator-approval-surface.md), [Role workspace surfaces](../learning/role-workspace-surface.md), [Activity](../learning/activity.md), Brand, and static assets.

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
