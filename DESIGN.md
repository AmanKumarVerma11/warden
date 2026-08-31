---
name: warden
description: A minimal, true-neutral monochrome dashboard for reading your AI agent's local footprint, in a dark and a light theme.
colors:
  bg: "#ffffff"
  bg-subtle: "#fafafa"
  fg: "#0a0a0a"
  fg-2: "#3a3a3a"
  fg-3: "#5c5c5c"
  fg-4: "#737373"
  line: "#ececec"
  line-2: "#dcdcdc"
  hover: "#f4f4f4"
  select: "#111111"
  select-fg: "#ffffff"
  red: "#d21f1f"
  amber: "#b45309"
  blue: "#1d4ed8"
  green: "#157f3c"
  red-dot: "#dc2626"
  amber-dot: "#d97706"
  blue-dot: "#2563eb"
  green-dot: "#16a34a"
typography:
  display:
    fontFamily: "ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "30px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.03em"
    fontFeature: "tabular-nums"
  headline:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-0.02em"
  body:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  mono:
    fontFamily: "ui-monospace, SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "12px"
    fontWeight: 400
    fontFeature: "tabular-nums"
  label:
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  sm: "3px"
  md: "5px"
components:
  button:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
    rounded: "{rounded.md}"
    padding: "7px 13px"
  button-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.fg}"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.fg-3}"
    rounded: "{rounded.md}"
    width: "32px"
    height: "32px"
  icon-button-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.fg}"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.fg-3}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
  nav-item-active:
    backgroundColor: "transparent"
    textColor: "{colors.fg}"
  tag:
    backgroundColor: "transparent"
    textColor: "{colors.fg-3}"
    rounded: "{rounded.sm}"
    padding: "1px 7px"
  tag-ok:
    backgroundColor: "transparent"
    textColor: "{colors.green}"
    rounded: "{rounded.sm}"
    padding: "1px 7px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.fg-2}"
    rounded: "{rounded.sm}"
    padding: "2px 7px"
  panel:
    backgroundColor: "transparent"
    rounded: "{rounded.md}"
    padding: "18px 20px"
---

# Design System: warden

<!-- impeccable:design-schema 1 -->

## Overview

**Creative North Star: "The Precise Instrument"**

warden looks like a measuring tool, not an admin console. It is near-monochrome minimalism: true-neutral black and white carry every surface in both a dark and a light theme (user-switchable, system default), and the interface earns trust by hiding nothing and adding nothing. There are no colored tiles, no gradients, no glows, no candy cards. What you see is the reading.

Density is calm and spacious. Structure is drawn with 1px hairlines instead of filled cards, key figures sit in a wide ledger band of large tabular-mono numbers split by rules, and the attention feed is plain typographic rows. Color is rationed to almost nothing: the four signal hues (red, amber, blue, green) appear only as small functional marks, so the eye is pulled only to what actually needs attention. The craft bar is Linear, Vercel, and Things.

The type system is deliberately OS-native. A system sans carries all UI, and a tabular monospace carries every number, size, path, and target, because the product makes zero network calls and refuses to fetch a web font. The result reads as an instrument: quiet, sharp, legible, and honest about what it is showing.

**Key Characteristics:**
- True-neutral monochrome in a dark and a light theme, user-switchable, system default.
- Hairline rules instead of card fills; generous air; flat, with zero shadows.
- System sans for UI, tabular monospace for every number, size, and path.
- Four signal colors as small status dots only, plus one warranted red on write-access flags and risk counts.
- An authored 1.5px line-icon set; no external fonts or assets (zero-network constraint).

## Colors

The palette is one neutral ink ramp doing almost all the work, with four signal hues held in reserve as small functional marks. There is no brand accent: hierarchy comes from where a token sits on the gray ramp, not from color. Every token has a light value (the base `:root`) and a dark override; frontmatter carries the light base, and the two-theme ramp is recorded in full below.

### Neutral

The structural ink ramp. Backgrounds, text at four contrast levels, hairlines, and the hover and selection washes.

| Token | Role | Light | Dark |
| --- | --- | --- | --- |
| `--bg` | Page ground | `#ffffff` | `#0a0a0a` |
| `--bg-subtle` | Inset ground (code blocks, telemetry samples) | `#fafafa` | `#141414` |
| `--fg` | Primary ink (headings, key values, active nav) | `#0a0a0a` | `#f6f6f6` |
| `--fg-2` | Secondary text (table cells, body copy) | `#3a3a3a` | `#c2c2c2` |
| `--fg-3` | Muted text (labels, subtitles, rest-state nav) | `#5c5c5c` | `#9a9a9a` |
| `--fg-4` | Faint text (paths, counts, units, chevrons) | `#737373` | `#808080` |
| `--line` | Hairline divider (rows, sections, panels) | `#ececec` | `#232323` |
| `--line-2` | Stronger hairline (borders, header rule) | `#dcdcdc` | `#313131` |
| `--hover` | Row and nav hover wash | `#f4f4f4` | `#161616` |
| `--select` | Text-selection background / inverse | `#111111` | `#f6f6f6` |
| `--select-fg` | Text-selection foreground / inverse | `#ffffff` | `#0a0a0a` |

### Signal (functional only)

Two tiers per hue. The base token (`--red`, `--amber`, `--blue`, `--green`) is the AA-legible text tone used when color touches a word or number; the `--*-dot` token is a marginally brighter fill for the small dots, where text contrast is not needed. In dark mode the two tiers unify onto one value.

| Hue | Meaning | Light text / dot | Dark (both) |
| --- | --- | --- | --- |
| Red | High severity, write access, risk counts | `#d21f1f` / `#dc2626` | `#f87171` |
| Amber | Medium severity | `#b45309` / `#d97706` | `#fbbf24` |
| Blue | Informational | `#1d4ed8` / `#2563eb` | `#60a5fa` |
| Green | OK, trusted, read-only, active | `#157f3c` / `#16a34a` | `#4ade80` |

### Named Rules

**The Signal-Only Rule.** The four signal hues appear only as small functional marks: a 6 to 7px status dot, a severity label, a write-access flag, an alarm count, an alarm figure. Never as a fill, background, border wash, gradient, or decoration. If a colored element is larger than roughly 7px or carries no severity or status meaning, it must be neutral ink.

**The Warranted Red Rule.** Red is the only signal permitted to leave the dot and color text or a number, and only for things that can act or leak: write-access flags (for example `--access-mode=unrestricted`), the possible-secrets figure when it is above zero, failed or queued egress counts when above zero, and high-severity marks. Red on text always reads as "this can act or leak," so keep it rare.

**The One-Ink Rule.** Everything structural is one neutral ramp. Depth, hierarchy, and grouping come from a token's position on the gray ramp and from hairlines, never from adding a color.

## Typography

**UI Font:** system-ui (with `-apple-system`, Segoe UI, Roboto, Helvetica, Arial, sans-serif)
**Numeric / Mono Font:** ui-monospace (with SF Mono, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace)

**Character:** OS-native and unshowy. The sans is whatever the operating system considers its clearest UI face; the mono is the system's code face, applied wherever precision and column alignment matter. The pairing is functional, not expressive: legibility and honesty over personality.

### Hierarchy

The scale is seven steps: 30, 21, 16, 14, 13, 12, and 11px.

- **Display** (mono, 400, 30px, line-height 1, `-0.03em`, tabular-nums): the ledger key figures only. Regular weight; size and mono alignment carry the number, not bold. The inline unit renders at 14px in `--fg-3`.
- **Headline** (sans, 600, 21px, `-0.02em`): the current view title in the topbar.
- **Title** (sans, 600, 16px, `-0.02em`): the largest content heading, used by rendered-markdown H1.
- **Body** (sans, 14px): the primary step. Default reading text at weight 400 (line-height 1.55); section and panel titles, alert titles, and markdown H2 sit at this same 14px at weight 600 (the wordmark rides the 16px step at weight 600) (titles track `-0.01em`).
- **Body Small** (sans, 400, 13px): secondary text: view subtitles, table cells, intros, nav items, alert details, list descriptions and previews, and the base rendered-markdown body.
- **Small / Mono** (12px, tabular-nums): the numeric and path treatment in the mono family (counts, byte sizes, paths, targets, model ids, timestamps, chips, inline code), plus small sans secondary text (section hints, panel subtitles, severity and flag labels).
- **Micro Label** (sans, 500, 11px, `0.06`–`0.08em`, UPPERCASE, `--fg-3`): section labels, table headers, figure captions, and definition-list terms; the outlined tag also sits at 11px.

Weights in use are 400 (body, secondary, figures, tags), 500 (table headers, buttons, flags), 550 (a deliberate semi step, for active nav, alert titles, emphasized cells, and note names), and 600 (headings, wordmark, panel titles).

### Named Rules

**The Tabular Truth Rule.** Every number, byte size, path, target, timestamp, and count renders in the mono stack with `font-variant-numeric: tabular-nums`, so digits align in columns and never shift width as values change between scans.

**The No-Web-Font Rule.** Zero external fonts by design. The product makes no network calls, so type must come from the OS. Never add an `@font-face`, a hosted-font link, or an icon font.

## Layout

A two-column app shell: a 232px fixed sidebar rail and a fluid `1fr` main column. Content sits in a single centered column capped at `max-width: 1080px`, with generous 48px horizontal gutters (`padding: 34px 48px 72px` on the view, `26px 48px 22px` on the topbar). The topbar is sticky and frosted; the sidebar is sticky at full viewport height.

The signature spatial unit is the ledger band: a responsive grid (`repeat(auto-fit, minmax(280px, 1fr))`, 28px by 34px gaps) of key figures, fenced top and bottom by hairlines. Panels grid at `minmax(300px, 1fr)`. Section rhythm is loose and airy, with 22 to 40px gaps between labeled regions.

Spacing is expressed as literal pixels rather than a named scale (there are no `--spacing-*` tokens), on a loose roughly 4px cadence that favors air over density.

There is one breakpoint, at `max-width: 840px`: the sidebar collapses from a left rail into a horizontal wrapping bar, the active-nav accent and per-section counts drop away, and gutters tighten to 20px.

### Named Rules

**The Hairline Rule.** Structure is drawn with 1px hairlines (`--line`, `--line-2`), never with filled boxes. Ledger bands, table rows, section dividers, and panels are all separated by a single rule.

## Elevation & Depth

The system is flat. There is not one `box-shadow` anywhere in the stylesheet. Depth is conveyed three ways: by tone (a token's place on the neutral ramp), by 1px hairlines that fence regions, and by exactly one frosted surface. The sticky topbar is the only lifted element: a translucent ground (`color-mix(in srgb, var(--bg) 88%, transparent)`) with `backdrop-filter: blur(10px)`, so content dissolves under it as it scrolls. State, not resting elevation, is what changes a surface: hover paints a `--hover` wash, `:active` nudges buttons down 0.5px, and keyboard focus draws a 2px `--fg-3` outline offset 2px.

### Named Rules

**The No-Shadow Rule.** Surfaces are flat at every rest state. The only depth cue in the whole system is the frosted sticky topbar; everything else is hairlines and tone. Do not add shadows, glows, or elevation layers.

## Shapes

Small radii only. `--radius` (5px) rounds buttons, icon buttons, panels, and code blocks; `--radius-sm` (3px) rounds nav items, tags, chips, and inline code. Borders are always 1px solid neutral. The only circles are the functional status dots (6 to 7px, `border-radius: 50%`), and the active-nav marker is a 2px ink accent bar. Nothing is pill-shaped, nothing is heavily rounded, and there is no clipping or masking.

### Named Rules

**The Quiet-Corner Rule.** Radii stay at 3 to 5px. Nothing is pill-shaped except the functional dots. Sharpness reads as precision.

## Components

### Buttons
- **Shape:** gently rounded (5px, `--radius`).
- **Secondary (the default, and the only button style):** transparent background, `--fg` text, a 1px `--line-2` border, `7px 13px` padding, 13px label at weight 500. There is no filled "primary" button; the outlined button carries every action, including Rescan.
- **Hover / Focus:** hover fills `--hover` and darkens the border to `--fg-4`; `:active` nudges down 0.5px; keyboard focus shows a 2px `--fg-3` outline offset 2px.

### Icon Button
- 32x32, grid-centered, transparent with a transparent 1px border, a 17px icon in `--fg-3`. Hover fills `--hover` and lifts the icon to `--fg`. Used for the theme toggle, which swaps between the authored sun and moon icons.

### Chips & Tags
- **Tag:** hairline outline (1px `--line-2`), 3px radius (`--radius-sm`), `1px 7px` padding, 11px text in `--fg-3`. The one colored variant is `.tag.ok`, which turns `--green` with a green-mixed border, used for trusted, active, and read-only states.
- **Chip:** mono, 12px in `--fg-2`, 1px `--line` outline, 3px radius, `2px 7px` padding. Used for tool names, model ids, MCP ids, and plugin names.

### Panels & Containers
- **Corner:** 5px (`--radius`).
- **Background:** none. A panel is defined by a single 1px `--line` border, never a fill.
- **Shadow:** none (see Elevation & Depth).
- **Padding:** `18px 20px`. Title at 14px / 600 / `-0.01em`, subtitle at 12px in `--fg-3`.

### Tables
- Header row: 11px uppercase labels in `--fg-3` on a `--line-2` bottom rule. Body rows: `--fg-2` cells on 1px `--line` dividers, with a `--hover` wash on row hover. Numeric and path cells switch to the mono stack. Each table scrolls horizontally inside its own `overflow-x: auto` wrapper so the page body never scrolls sideways.

### Navigation (sidebar)
- A 232px fixed left rail, sticky at full height. Items are 13px, `--fg-3` at rest, each with a 17px authored line icon and a right-aligned mono count. Hover lifts to `--fg-2` on `--hover`. The active item is `--fg` at weight 550 with a 2px ink accent bar in the gutter. A count turns red when its section needs attention (`.nav-count.alarm`). Below 840px the rail becomes a horizontal wrap, and the accent bar and counts are hidden.

### Ledger Figure (signature)
- The key-figure unit that opens the Overview, Activity, and Privacy views. A large tabular-mono value (30px, weight 400, `-0.03em`, line-height 1) with a small inline unit (14px, `--fg-3`), an 11px uppercase `--fg-3` label, and an optional 12px `--fg-4` sub-line. When the figure is a live risk (possible secrets above zero, failed egress above zero) the value turns `--red` via `.fval.alarm`.

### Attention Alert Row (signature)
- The ranked feed on the Overview. A full-width typographic button: a 7px severity dot (red, amber, or blue), a 550-weight title with a `--fg-3` detail line, and a trailing chevron in `--fg-4`. No card, just a `--line` bottom rule and a `--hover` wash on hover. Selecting a row routes to the relevant view.

### Severity Mark / Status Dot (signature)
- The system's single unit of color. A 6px dot plus a label (`.mark`); the high variant also raises its text to `--fg`. Dots use the `--*-dot` fill tokens. The same grammar recurs as the sidebar status pills (Read-only, Local), the inline table marks, and the 7px alert dots.

### Write-Access Flag (signature)
- The warranted red. `.flag` renders a red dot plus 12px `--red` text at weight 500, marking an MCP door that can write and not only read. This, together with the alarm figures and alarm counts, is the only place red touches text.

## Do's and Don'ts

### Do:
- **Do** carry every surface with the neutral ink ramp and separate regions with 1px hairlines (`--line`, `--line-2`).
- **Do** render every number, byte size, path, target, and timestamp in the mono stack with `tabular-nums`, so columns of digits align.
- **Do** keep both themes at parity: build screens from the true-neutral tokens (`--bg`, `--fg`, `--fg-2` through `--fg-4`) so a view works unchanged in dark and light.
- **Do** reserve red text for things that can act or leak (write-access flags, secret counts, failed-egress counts, high severity), and keep it rare.
- **Do** keep radii small (3px and 5px) and corners quiet; let sharpness read as precision.
- **Do** size status dots at 6 to 7px and give each severity its dot color (`--red-dot`, `--amber-dot`, `--blue-dot`, `--green-dot`).

### Don't:
- **Don't** fill cards or regions with a background color, or use gradients, glows, or shadows; there is not one `box-shadow` in the system, and the only depth cue is the frosted sticky topbar.
- **Don't** use the signal hues as fills, backgrounds, borders, or decoration; they are small marks that mean severity or status, nothing else.
- **Don't** set UI text in the mono font or numbers and paths in the sans; the two families do not cross roles.
- **Don't** add an external or hosted font, an icon font, or a remote asset; the product makes zero network calls, so everything is OS-native or authored inline.
- **Don't** introduce a brand accent color; the system has no primary hue, only neutral ink plus rationed signals.
- **Don't** round anything heavily or make dots and tags into large pills; only the functional status dots are fully circular.

## Marketing Site (landing surface)

`site/index.html` is a separate Persuade surface (a public marketing landing) that inherits this world and expands it for a page whose job is to convince and route, not to operate. It is deployed statically; its "Open the live demo" button opens the dashboard itself running client-side on demo data.

- **World, inherited.** True-neutral monochrome, hairline rules between sections (no card fills), system sans + tabular mono, and a single blue signal dot (`--blue-dot`) as the only accent in the page's own chrome (the roadmap "Now" marker and trust-pillar dots). Non-blue signal hues appear only inside the embedded product screenshots. Dark and light, driven by `prefers-color-scheme`, `?theme=`, and a toggle stored in `warden-theme`.
- **Type scale, expanded for Persuade.** Display headings use `clamp()`: hero `clamp(2.35rem, 5vw, 3.9rem)`, section headings `clamp(1.55rem, 2.6vw, 2.05rem)`, the problem "ask" `clamp(1.8rem, 4vw, 3rem)`, tracking to `-0.04em`. Body 16–18px, secondary 13–15px, mono 13–14px. This richer scale is specific to this surface; the app's Operate ramp is unchanged.
- **Signature composition: the product is the hero.** A plain-spoken headline, subhead, primary/secondary CTAs, and a copy-able install command, then a full-width band of the real readout (theme-adaptive screenshot, cropped `2/1` desktop and `4/3` mobile, linked to the demo). No hero card shell, no adjective-and-gradient hero.
- **No eyebrows.** Section headings stand alone; the kicker/eyebrow-above-heading pattern is not used anywhere.
- **Motion.** One restrained heading-rise (opacity + 14px translate, exponential ease-out from visible) applied to section headings only, gated by `prefers-reduced-motion`.
- **Deployment.** Static; the demo and its screenshots are generated by `scripts/build-site.mjs` from `src/ui` + `demoModel()` and are gitignored. The tool itself is never hosted.
