# Foyer Design System

The design system of **Foyer S.A.**, Luxembourg's largest privately-owned insurance group. This package is the single source of truth for visual language, voice, and core components across every Foyer product surface — from the agent-facing quoting app to the customer self-service portal to the corporate site.

## What's in this package

| Path | Purpose |
|---|---|
| `colors_and_type.css` | All design tokens as CSS custom properties + utility classes. **Import this first.** |
| `preview/type.html` | Typography scale, weights, single-family system |
| `preview/colors.html` | Color ramps, semantic families, applied examples |
| `preview/spacing.html` | 4px grid, radii, elevation, density, 12-col grid |
| `preview/components.html` | Buttons, forms, tiles, alerts, stepper, rows |
| `preview/brand.html` | Logo, voice, iconography, do/don't |
| `assets/` | Logo SVGs (positive, horizontal, reversed) |
| `SKILL.md` | How Claude should apply the system |

Open any file under `preview/` to see the system in use.

---

## CONTENT FUNDAMENTALS

### Voice
Three registers, always together:

1. **Calm** — Never alarmist, even when reporting a loss. Plain facts, clear next step. No exclamation points in product UI.
2. **Precise** — Give numbers, dates, references. Luxembourgers reward specificity. Avoid "soon", "some", "a few".
3. **Human** — Speak like a trusted agent, not a policy document. Short sentences, verbs over nouns, *vous* not *le client*.

### Formats
- **Currency:** `€ 1 480,40` — non-breaking space thousands, comma decimal.
- **Dates:** `14 nov. 2025` (FR) or `14. November 2025` (DE). Never US-style.
- **Policy references:** `FR-8421-0093`. Always with the hyphenated prefix.
- **IBAN:** grouped in fours — `LU28 0019 4006 4475 0000`.

### Copy rules
- One primary CTA per screen. No "ACTION REQUISE" in all-caps banners.
- Use *vous* (never *tu*, never third-person *le client*).
- French is the default; DE and LU variants translated via locale files, never auto-translated.
- Never apologize in passive voice. "Nous n'avons pas pu…" — not "il y a eu un problème".
- Never use emojis in product UI. Rely on the iconography set or semantic color dots.

---

## VISUAL FOUNDATIONS

### Color
- **Foyer Blue `#004C92`** is the ONLY brand color. CTAs, links, selection, headlines of importance, charts, illustrations — every screen is anchored by it.
- **Feather grey** does 70% of the work. Text, borders, surfaces.
- **Three utility families** — Success (green), Warning (orange), Danger (red) — signal state only. They are NOT brand colors. Never place the logo on them, never use them as CTAs that aren’t stateful. Always pair with icon or text; never color alone.
- Informational cues use Foyer blue, not a separate “info” color. The old `--fds-info-*` and `--fds-secondary-*` tokens are removed — do not reintroduce.

Full ramps live in `preview/colors.html`. Token names are `--fds-primary-500`, `--fds-feather-grey-600`, `--fds-success-500`, `--fds-warning-500`, `--fds-danger-500`, etc.

### Typography
- **Inter** — the one Foyer typeface. Variable 100–900, shipped locally from `fonts/Inter-VariableFont_opsz_wght.ttf`. Used for 100% of text — product UI, marketing, editorial moments, hero numerals.
- **No second family.** No DM Sans, no Source Serif. If Inter fails to load, the stack falls back to the OS sans — that's an incident, not a design variant.
- **Scale:** display XL 64 → H1 28 → body 15 → micro-caps 11. Minimum body size 13px; minimum interactive text 14px.
- **ALL CAPS** is reserved for buttons, eyebrows, and section labels — always with `letter-spacing: 0.06em`.

### Spacing
- **4-point grid.** Tokens from `--fds-space-1` (4px) to `--fds-space-24` (96px). Never eyeball.
- **Default card padding:** 24px.
- **Default form field spacing:** 20px between fields, 6px between label and field.
- **Page-level section break:** 40–48px.

### Radii
- `xs 4` chips · `sm 6` inputs · `md 8` default · `lg 12` cards · `xl 16` feature panels · `full` pill buttons.
- Foyer is formal work, not friendly-app work — keep radii gentle.

### Elevation
- **Level 0** (flat, border only) is the default inside product.
- **Level 1–2** for hover/raised states.
- **Level 3** is reserved for overlays (modals, popovers, sheets).
- Avoid level 4+ inside the product — it's for marketing only.

### Grid
- 12 columns, 1280px container, 24px gutter, 56px side gutter on desktop.
- Mobile: single column, 16px side gutter.

---

## ICONOGRAPHY

- **Style:** line-based, 1.5-stroke, rounded joins, on a 24×24 grid.
- **Color:** primary-500 by default; inherits `currentColor` when placed on semantic backgrounds.
- **Sizes:** 16 (inline), 20 (buttons), 24 (list rows), 28–32 (feature tiles).
- **Core set:** Habitation, Auto, Vie, Santé, Documents, Paiement, Échéance, Conseiller — see `preview/brand.html`.
- **Never:** filled iconography, duotone, emoji. No 3D isometric illustrations.

---

## ACCESSIBILITY

- **Contrast:** body text ≥ 4.5:1, large text ≥ 3:1. Foyer blue on white = 8.6:1 ✓.
- **Focus ring:** 3px primary-500 at 28% opacity — always visible on keyboard focus.
- **Hit targets:** minimum 44 × 44 px on mobile, 32 × 32 px on desktop.
- **Error state:** never color alone — always icon + text label.
- **Motion:** respect `prefers-reduced-motion`; never animate critical UI above 200ms.

---

## FILE-BY-FILE USAGE

```html
<link rel="stylesheet" href="path/to/colors_and_type.css" />
```

Everything else is optional — grab the classes you need (`fds-btn`, `fds-badge`, `fds-panel`, `fds-input`) or compose with the raw tokens (`var(--fds-primary-500)`, `var(--fds-space-6)`).
