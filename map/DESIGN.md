---
design_system:
  name: "ThoraxScan"
  version: "0.1.0"
  status: "lo-fi prototype reference"
  source:
    figma_file: "https://www.figma.com/design/trV0538sgRpPHXc6160ok2/Lo-Fi-ThoraxScan"
    frame_ids: ["473:1183", "485:1025", "651:882", "560:777", "653:797", "653:811", "473:514", "498:1412", "473:580", "657:1091", "657:1222", "473:633", "473:834", "473:914", "473:1045", "473:981", "651:852", "667:960", "667:971", "667:982", "678:1015", "681:1448", "681:1577", "681:1754", "684:1934", "684:2126", "684:2268"]
  tokens:
    colors:
      canvas: "#000000"
      app_background: "#0C0E1C"
      sidebar_background: "#040828"
      surface_primary: "#010D2A"
      surface_secondary: "#0A1223"
      surface_field: "#18202D"
      surface_overlay: "#212121"
      border_default: "#6D6D6D"
      border_strong: "#838383"
      text_primary: "#FAFAFA"
      text_secondary: "#A7A7A7"
      text_muted: "#767676"
      text_disabled: "#6B6B6B"
      brand_blue: "#0077FF"
      brand_blue_text: "#51B6FF"
      brand_blue_soft: "rgba(0,119,255,0.35)"
      active_navigation_fill: "rgba(44,174,255,0.21)"
      success_green: "#24FF3D"
      success_fill: "rgba(0,224,93,0.46)"
      warning_yellow: "#F6FF00"
      disclaimer_yellow: "#FFD636"
      warning_fill: "rgba(255,193,48,0.29)"
      error_red: "#FF0000"
      disabled_gray: "#D9D9D9"
      purple_accent: "#9500DA"
    typography:
      font_families:
        brand: "Inter"
        display: "Funnel Display"
        body: "Funnel Display"
      weights:
        light: 300
        regular: 400
        medium: 500
        semibold: 600
        extrabold: 800
      sizes_px:
        caption: 11
        small: 12
        body: 13
        body_large: 16
        section: 20
        page_title: 27
        brand: 32
        auth_title: 32
        hero: 48
        landing_hero: 64
      line_heights:
        compact: 1.0
        body: 1.4
        relaxed: 1.6
    spacing:
      base_px: 4
      scale_px: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 72, 79, 100]
    radii_px:
      input: 5
      card: 7
      panel: 10
      pill: 15
    borders:
      default_width_px: 1
      default_style: "solid"
    shadows:
      button: "0 4px 4px 0 rgba(0,0,0,0.25)"
    layout:
      desktop_canvas: { width_px: 1440, height_px: 1024 }
      authenticated_sidebar_width_px: 230
      authenticated_topbar_height_px: 79
      auth_split_column_width_px: 720
      auth_card_width_px: 551
      auth_card_height_px: 747
    icon_sizes_px:
      navigation: 24
      header_bell: 30
      header_reload: 32
      logo_mark_authenticated: 45
      logo_mark_public: 59
    components:
      primary_button: { background: "#0077FF", text_color: "#FAFAFA", radius_px: 7, shadow: "0 4px 4px 0 rgba(0,0,0,0.25)" }
      auth_input: { background: "#18202D", border_color: "#777777", height_px: 53, radius_px: 5 }
      auth_card: { background: "#010D2A", border_color: "#838383", radius_px: 10 }
      settings_save_button: { height_px: 34, radius_px: 5, gradient_start: "#4363FF", gradient_end: "#8397FE" }
      nav_active: { fill: "rgba(44,174,255,0.21)", border_color: "#0077FF" }
      privacy_callout: { fill: "rgba(0,224,93,0.46)", border_color: "#007623" }
      info_callout: { fill: "rgba(0,132,255,0.49)", border_color: "#013AB5" }
    behavior:
      motion: "not specified"
      responsive_breakpoints: "not specified"
      focus_ring: "needs implementation definition"
      loading_states: "needs implementation definition"
      empty_states: "needs implementation definition"
      error_states: "needs implementation definition"
---

# ThoraxScan Design System

## 1. Purpose and source confidence

This file gives coding agents a persistent visual reference for ThoraxScan. YAML front matter is the normative token layer. The prose explains how to apply the tokens and preserve the product's visual intent.

The values are extracted or normalized from the supplied lo-fi Figma frames. Repeated visible values are treated as confirmed. Motion, responsive breakpoints, focus-ring styling, and most system states are not defined by the frames and are marked as needing confirmation.

The professor frame IDs are supplied as part of the design set, but several exact screen titles and control details were not exposed. Keep the same visual identity for professor views and avoid inventing a separate visual language.

## 2. Visual identity

ThoraxScan uses deep navy and near-black surfaces, electric blue actions, white primary text, muted gray support copy, yellow educational warnings, and green local-processing/success states.

The product should feel technical and focused while remaining clearly educational. Do not make the interface look like a clinical diagnostic console. The X-ray and attention heatmap should be the visual focus of analysis screens.

The wordmark uses Inter ExtraBold with Thorax in white and Scan in brand blue. Public and authenticated logo marks use different source sizes; use the corresponding tokens.

## 3. Color application

Use surface tokens from broadest to most local:

1. app_background for the application canvas.
2. sidebar_background for authenticated navigation.
3. surface_primary for auth cards and major panels.
4. surface_secondary for compact dark regions.
5. surface_field for inputs and interactive controls.
6. surface_overlay for charcoal image/analysis regions.

Use brand_blue for primary buttons, Login, Confirm, active navigation, links, and brand emphasis. Use brand_blue_text for secondary blue copy on dark surfaces. Use active_navigation_fill with a brand-blue border for the current navigation item.

Use warning_fill and disclaimer_yellow for educational/caution messaging. Use privacy_callout and success_green for Local Processing Enabled and completed states. Use error_red for destructive/error messaging. Never use color alone for status, validation, heatmap meaning, or permissions.

The settings Save Changes control uses a blue gradient from gradient_start to gradient_end. Limit this gradient to that primary save action.

## 4. Typography

Inter is for the brand and large public hero statements. Funnel Display is for application headings, labels, navigation, body copy, captions, and buttons.

Use ExtraBold for the wordmark, hero statements, page titles, primary buttons, and section titles. Use SemiBold for prominent supporting copy. Use Medium for settings tabs and secondary headings. Use Regular for navigation and body text. Use Light for helper text, dates, and footer metadata.

Use the token sizes as follows:

- landing_hero for the public hero.
- hero for large authentication/product statements.
- brand for the wordmark.
- page_title for authenticated page titles.
- section for panel headings.
- body_large and body for application labels and copy.
- small and caption for helper text, dates, and footer metadata.

Keep headings concise and high contrast. Preserve ThoraxScan, SqueezeViT, and ONNX Runtime Web spelling.

## 5. Layout and spacing

The supplied frames are desktop compositions at 1440 by 1024. Authentication uses a 720 px visual split between the branded left side and the form/card right side. Auth forms use a dark card approximately 551 by 747 px.

The authenticated shell uses a 230 px sidebar and a 79 px top bar. Main content begins after the sidebar and below the top bar. Use breadcrumbs near the content top. Keep page titles aligned to the content column. Reserve the footer for model/runtime status, prototype version, and the non-diagnostic disclaimer.

Use the spacing scale. Default to 16 px between related controls, 24–32 px between sections, and 64 px or more between major hero blocks. Prefer one primary task per panel and avoid excessive card nesting.

## 6. Surfaces, borders, radii, and shadows

Use a small number of dark surface levels. Inputs should be visibly lighter than the card they sit inside. Settings panels use black/dark surfaces with gray outlines.

- Default border: 1 px solid border_default.
- Strong panel border: 1 px solid border_strong.
- Active border: brand_blue.
- Input radius: 5 px.
- Button radius: 7 px.
- Panel/card radius: 10 px.
- Pill/banner radius: 15 px.
- Button shadow: the supplied 0 4px 4px shadow.

The broader application is mostly flat and border-defined. Do not add heavy shadows to every panel.

## 7. Component guidance

### Primary button

Use brand_blue background, text_primary text, 7 px radius, and the button shadow. Use Funnel Display ExtraBold. Login, Confirm, Save Changes, Publish, and Submit are primary-action candidates, but the exact hierarchy for professor screens needs confirmation.

Provide disabled and loading states even though their final visuals are not supplied. Prevent duplicate action submits.

### Auth input

Use surface_field background, a 1 px gray border, 53 px height, and 5 px radius. Every field needs a visible/programmatic label. Error text sits close to the field and is not communicated by red alone.

### Auth card

Use surface_primary background, border_strong border, and 10 px radius. Keep title, helper copy, credential fields, primary action, and recovery links visually separated.

### Sidebar navigation

Use 230 px width and sidebar_background. Navigation icons are 24 px. The active item uses active_navigation_fill and a blue border/indicator. Pair icons with text labels. Logout is visually separated near the bottom and uses an error treatment.

### Top bar

Use 79 px height. The source shows ThoraxScan context, a notification bell, a reload control, a date, and breadcrumb/page context. Bell is 30 px and reload is 32 px. Use muted gray for secondary metadata.

### Settings

Use Profile, Display, and Privacy and Data as distinct categories. The active category uses a blue-tinted fill and blue border. Align Save Changes with the lower action area. Treat privacy copy as a first-class panel rather than a tooltip.

### Privacy and local processing callout

Use the green privacy callout for Local Processing Enabled. Preserve the explicit statement that X-ray images are analyzed entirely on-device using ONNX Runtime Web and are not sent to external servers. Pair shield/check iconography with accessible text.

### Educational disclaimer

Use the warning fill and disclaimer yellow. Keep Educational Disclaimer emphasized. Preserve the statement that ThoraxScan is for Radiologic Technology student training and not clinical diagnosis or patient care.

### X-ray and Attention Heatmap workspace

Make the X-ray the largest visual object. Keep controls beside essential image content unless the source explicitly uses an overlay. Provide a heatmap legend or textual explanation; this is not defined in the source and needs confirmation. Keep the model/runtime status near the analysis workflow. Never present the heatmap as diagnostic evidence.

### Feedback and status

Success uses green, warnings use yellow, and errors use red plus explanatory text. Use inline feedback for field validation and panel-level feedback for processing, submission, publishing, and saving. Toast/banner/dialog treatment is not specified.

## 8. Iconography

The source uses Hicon-style linear, outline, and bold icons.

- Navigation icons: 24 px.
- Header bell: 30 px.
- Reload: 32 px.
- Public logo mark: 59 px.
- Authenticated logo mark: 45 px.

Use a consistent monochrome stroke treatment. Icons support recognition but never replace labels for primary navigation. Source icon concepts include Home, Scan, Document, Search, Settings, Profile, Shield, Tick Circle, Bell, Reload, and Logout. Do not use emoji or multicolor icons.

## 9. Interaction states

### Active

Use a blue indicator or border with translucent blue fill. Keep active text and icon high contrast.

### Hover and focus

Hover and focus styles are not specified. Implement a visible focus ring that meets contrast requirements and does not change the semantic color hierarchy.

### Disabled

Use text_disabled and subdued surfaces/borders. Preserve the label and explain why the control is unavailable where relevant.

### Loading

Add consistent accessible processing states for login, OTP, local inference, submission, publishing, and saving. Prevent duplicate actions.

### Empty

Add concise empty states for activities, submissions, rosters, and analytics with one relevant next action. Final visuals need confirmation.

### Error

Use text plus icon or border, not red alone. Keep recoverable user input. Provide Retry or Return actions where appropriate.

### Success

Use green confirmation and text that explains what was saved, submitted, published, or processed and where the user can go next.

## 10. Accessibility

The frames are visual references and do not define complete accessibility behavior. Implement:

- Keyboard navigation for controls and sidebar items.
- Visible focus indication on dark surfaces.
- Programmatic labels for inputs, icons, navigation, buttons, and image controls.
- Text alternatives or descriptions for X-ray and heatmap visualizations.
- Field-associated and announced validation errors.
- Color-independent status communication.
- Accessible names for Remember me, notification, reload, Save Changes, and Logout.
- Logical focus order in auth cards, settings, and analysis workspaces.
- Focus trapping/restoration for any future dialogs.
- Sufficient contrast between text and surfaces.
- A screen-reader-readable non-diagnostic disclaimer.

Do not claim clinical accessibility or medical compliance from these lo-fi frames alone.

## 11. Responsive behavior

Only wide desktop compositions are supplied. Mobile/tablet breakpoints, sidebar collapse, mobile navigation, auth stacking, heatmap resizing, analytics responsiveness, and disclaimer wrapping are undefined.

Implement desktop fidelity first. Treat responsive behavior as Needs confirmation and preserve the same hierarchy, contrast, and task sequence when it is later specified.

## 12. Content and tone

Use direct, instructional, educational language. Prefer labels such as Login, Confirm, Save Changes, Verify OTP, Publish, Submit, and Logout. Keep support copy concise. Keep the non-diagnostic warning explicit and prominent.

Use student, professor, activity, X-ray, Attention Heatmap, SqueezeViT, and ONNX Runtime Web consistently. Do not use clinical certainty language such as diagnose or confirm disease unless the approved product scope changes.

## 13. Implementation checklist

- Load YAML tokens as the source of truth.
- Define colors before building components.
- Load Inter and Funnel Display with the listed weights.
- Build the 230 px sidebar and 79 px top bar.
- Build public/auth layouts at supplied desktop proportions.
- Implement primary buttons, auth inputs, auth cards, sidebar navigation, settings panels, privacy callouts, and disclaimer banners.
- Preserve dark surfaces and blue active states.
- Add labels, focus behavior, and accessible text not visible in the lo-fi frames.
- Add loading, empty, error, and success states as implementation states and obtain approval for their final visuals.
- Avoid inventing mobile layouts, motion, or professor-specific components until confirmed.
- Keep X-ray and heatmap content visually dominant.
- Keep educational and privacy copy visible near the relevant flow.

## 14. Open design-system questions

| ID | Question | Impact |
| --- | --- | --- |
| DS-001 | What are the mobile/tablet breakpoints? | Responsive layout |
| DS-002 | What is the approved focus-ring color/thickness? | Accessibility |
| DS-003 | Which loading, empty, success, and error components are standardized? | State consistency |
| DS-004 | Are Student and Professor shells identical or role-specific? | Navigation/components |
| DS-005 | Is the official product spelling ThoraxScan or Thorax Scan? | Brand consistency |
| DS-006 | Are heatmaps interactive, zoomable, or static? | Analysis workspace |
| DS-007 | What heatmap legend and accessible alternative are approved? | Data visualization |
| DS-008 | Which settings persist locally versus remotely? | Privacy/data behavior |
| DS-009 | What motion/transitions are approved? | Interaction polish |
| DS-010 | Which professor-frame controls and titles are final? | Component inventory |

## 15. Token usage example

Use semantic tokens instead of raw values in application code.

~~~css
:root {
  --color-app-background: #0C0E1C;
  --color-surface-primary: #010D2A;
  --color-surface-field: #18202D;
  --color-brand-blue: #0077FF;
  --color-text-primary: #FAFAFA;
  --color-text-secondary: #A7A7A7;
  --radius-panel: 10px;
  --radius-control: 5px;
  --shadow-button: 0 4px 4px 0 rgba(0,0,0,0.25);
  --layout-sidebar-width: 230px;
  --layout-topbar-height: 79px;
}
~~~

The YAML values are normative. When a high-fidelity Figma revision changes a value, update this file and treat the revised token as the new source of truth.

