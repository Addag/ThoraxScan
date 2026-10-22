---
node_type: schema
universe: live
status: verified
audited: 2026-10-22
snapshot: main @ 583fbab + working tree
---

# Design tokens

ThoraxScan’s current visual token layer is the CSS custom properties in globals.css, plus Tailwind v4 utilities across public, authenticated, and shared surfaces. globals.css holds only tokens, `@theme inline`, custom variants, and `@layer base`.

## Why this shape

The landing, authentication, administration, role dashboards, and activity surfaces share colors, typography, borders, status treatments, and responsive rules through tokens and component utilities.

## Shape

Glass hierarchy uses three shared surface tokens in [globals.css](<../../../src/app/globals.css:3>): `--glass-shell` for darker navigation, `--glass-surface` with `--glass-shadow` for primary panels, and `--glass-inset` with an inset highlight for nested cards. Workspace cards, administrator application cards, model status cards, and statistic tiles omit additional backdrop blur; primary panels retain it. Selected navigation/role colors and image-frame backgrounds remain separate. Verified against the working tree on 2026-09-12.

Core variables include canvas, app background, surfaces, borders, text, brand blue, success green, warning yellow, and purple accent in [globals.css](<../../../src/app/globals.css:3>). The shared Settings surface styles its category rows, panels, status treatments, switch, and action gradient with Tailwind utilities in [settings-form.tsx](<../../../src/components/settings/settings-form.tsx>).

App-wide defaults (html/body background, colour, cursor and font; the shared `:focus-visible` outline; the reduced-motion override; and the `@supports` glass-token fallback) sit in `@layer base` in [globals.css](<../../../src/app/globals.css:52>), on top of Tailwind's preflight, which already supplies box-sizing, margin reset, form-control fonts and link colour. The landing page uses inline utilities in [page.tsx](<../../../src/app/page.tsx>), with landing background and shadow tokens in globals.css. `@theme inline` exposes `background`, `foreground`, and `brand` colors to utilities in [globals.css](<../../../src/app/globals.css:36>); other tokens are used as `bg-(--name)` / `text-(--name)`. Utility-styled surfaces: the shared role shell in [app-shell.tsx](<../../../src/components/app-shell.tsx>) and [app-sidebar.tsx](<../../../src/components/app-sidebar.tsx>), [EmptyState](<../../../src/components/empty-state.tsx>), the [activity button classes](<../../../src/components/activities/activity-button.ts>) and [primary button utilities](<../../../src/components/primary-button.ts>), the administrator approval surface (including the Professor application review form), Learning Mode with the built-in X-ray library, and the shared Settings surface. Landing and authentication use exact inclusive `stacked`, `tablet`, and `narrow` custom variants. `no-backdrop` checks both the standard and WebKit backdrop-filter properties. Other surfaces use `max-[Npx]:` variants, which exclude the boundary pixel that legacy `max-width` queries include. Shared dashboard primitives live in [dashboard-ui.tsx](<../../../src/components/dashboard-ui.tsx>) and cover [PageMain](<../../../src/components/dashboard-ui.tsx:14>), page headings, section headings, statistic cards, workspace cards, glass panels, badges, back links, empty text, and form-status colors. The [Brand](<../../../src/components/brand.tsx>) variants provide landing, authentication, and sidebar logo layouts; [field-error.ts](<../../../src/components/field-error.ts>) centralizes auth and review error text. The role dashboards, Professor application, Professor workspace detail surface, and all Activities shared UI, list pages, authoring forms, submission form, AI panels, and detail layouts now use Tailwind utilities. Student Reviews, faculty evaluation panels, and the attention heatmap also use component utilities with shared [review styles](<../../../src/components/professor/review-styles.ts>). Review cards remain borderless; release buttons retain their existing gradient and shadow. New UI uses Tailwind utilities; don't add component CSS to `globals.css`.

The shared role shell renders a "Skip to main content" link as its first focusable element in [app-shell.tsx](<../../../src/components/app-shell.tsx:70>). It targets `#main-content`, which [PageMain](<../../../src/components/dashboard-ui.tsx:25>) and the [Learning Mode main](<../../../src/components/learning/learning-mode-content.tsx:7>) carry with `tabIndex={-1}`, so a new authenticated page must render through one of them. Text colors are kept at 4.5:1 or better against their surface. `#aeb6c5` is the muted text and `#9ba2b8` the placeholder color on dark panels. The X-ray preview's empty state switches to dark text when the light image background setting is on.

Light theme: `:root[data-theme="light"]` in globals.css overrides the colour tokens. These include `--border-subtle`, `--border-shell`, `--border-field`, `--surface-input(-readonly)`, `--surface-raised`, `--surface-sunken`, `--hover-overlay`, `--focus-ring` and `--status-{error,success,info,warning,accent}-text`. The inline script in [layout.tsx](<../../../src/app/layout.tsx>) runs [applySavedDisplayPrefs](<../../../src/lib/display-prefs.ts>) to apply the saved `localStorage.theme` before paint, and the sun/moon `ThemeIconButton` in [theme-toggle.tsx](<../../../src/components/theme-toggle.tsx>), rendered on the right of the role-shell header in [app-shell.tsx](<../../../src/components/app-shell.tsx>), writes it. Below 850px the header is hidden, and the same button sits beside the Menu button in the mobile bar in [app-sidebar.tsx](<../../../src/components/app-sidebar.tsx>).

All authenticated surfaces and the Terms and Privacy pages follow the theme. Hex values with an exact token equivalent were replaced by that token, for example `text-white` became `text-(--text-primary)` and `border-[#33425c]` became `border-(--border-shell)`. Other hardcoded colours keep their dark value and carry a `light:` override beside it, such as `text-[#9fcfff] light:text-(--brand-blue-text)`, so dark mode is unchanged. White text on saturated fills (buttons, badges), dark buttons with white text, and the X-ray image frames and thumbnails stay as they are in both themes.

The landing page ([page.tsx](<../../../src/app/page.tsx>)) and the auth screens ([auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>)) set `data-theme="dark"` on their root. That re-applies the dark tokens, and the `light:` variant excludes anything under it, so they stay dark in both themes.

New UI uses tokens or adds a `light:` override; a bare light hex such as `text-[#c7d4e8]` will render pale-on-white in light mode.

Accessibility: font sizes are rem (`text-[0.8125rem]`, not `text-[13px]`), so the browser's font-size setting and Settings → Accessibility scale them; new UI uses rem font sizes. Two exceptions stay px: the auth screens ([auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>), [auth-form.tsx](<../../../src/components/auth/auth-form.tsx>)), whose absolutely positioned intro panel overlaps the X-ray image when text grows, and the [Brand](<../../../src/components/brand.tsx>) wordmark, which would overflow the 230px sidebar. `:root[data-text-size="large"|"larger"]` sets the root font size to 112.5% / 125% in [globals.css](<../../../src/app/globals.css>). `data-contrast="high"` swaps in a high-contrast token block for dark (including the dark-pinned landing and auth subtrees) and one for light: solid glass surfaces, black or white canvas, near-primary secondary text, strong borders and brighter status text, all 7:1 or better. Only tokens change; hardcoded hexes keep their colour. `applySavedDisplayPrefs` sets `data-theme`, `data-text-size` and `data-contrast` before paint and, with no saved contrast choice, follows `prefers-contrast: more`.

Every pressable element has a 160ms Tailwind hover, picked by its fill: bright fills (brand blue, gradients) use `transition-[filter] duration-160 not-disabled:hover:brightness-115`; transparent controls (sidebar nav, Log out, outline/ghost buttons, inactive chips and tabs, dashboard activity cards) use `transition-colors duration-160 hover:bg-(--hover-overlay)`; dark or tinted fills (activity secondary/danger, red reject, dark filter buttons) lighten their own color, e.g. `hover:bg-[#2b3649] light:hover:bg-(--surface-sunken)`; small text links (`reviewLinkClass`, `backLinkClass`, "View all", "Open activity") use `transition-colors duration-160 hover:text-(--text-primary)`. Selected nav items, chips, and tabs keep their highlight. `primaryButton` and other components that already defined a `hover:` keep their own. Brightness is invisible on white-text/transparent elements, so never use it there. New buttons and button-style links follow the same rule; the shared class constants ([activity buttons](<../../../src/components/activities/activity-button.ts>), [review styles](<../../../src/components/professor/review-styles.ts>), [dashboard-ui](<../../../src/components/dashboard-ui.tsx>)) already carry it.

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

Authentication screens use Tailwind utilities in [auth-layout.tsx](<../../../src/components/auth/auth-layout.tsx>) and [auth-form.tsx](<../../../src/components/auth/auth-form.tsx>), with shared error text and eyebrow classes in [field-error.ts](<../../../src/components/field-error.ts>). The profile-error card is utility-styled alongside the authenticated surfaces.

