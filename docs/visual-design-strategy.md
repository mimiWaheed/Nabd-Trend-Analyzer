# NABD (نبض) — Visual Design Strategy

**Scope:** Dashboard workspace, Profile, Settings.
**Constraint:** Visual refinement only. Widgets, ordering, information architecture, interactions, and user flows are frozen. This document describes *how* the existing interface is re-presented, not *what* it does.

---

## 1. Direction — "Executive Intelligence"

The current interface reads as a generic dark admin template: a wall of identical translucent cards over near-black, uniform weight, small compressed type, no focal point.

The target is an **executive intelligence situation room** — the calm authority of Apple Pro / Linear / Stripe / Vercel dark UIs applied to a strategic-command product. The dashboard should feel like a briefing document handed to a decision-maker:

- calm, not loud
- layered, not flat
- editorial, not templated
- confident, not decorative

## 2. Design principles

1. **Hierarchy over symmetry.** One focal point per view — the intelligence brief. Everything else is supporting evidence.
2. **Material depth over transparency.** Opaque layered navy surfaces replace washed-out white-alpha glass. Depth comes from surface lightness, not blur and glow.
3. **Hairlines over boxes.** Borders are thin, blue-tinted hairlines. Separation comes from spacing and inset surfaces, not heavy outlines.
4. **Restraint in motion.** No new animation. Existing entrances are kept; glows are reduced to a whisper.
5. **Editorial typography.** Type does the heavy lifting — scale, tracking, and rhythm, not color.

## 3. Surface system — three levels

The core anti-fatigue move. Every container is classified into one of three visual levels; they never compete.

| Level | Role | Treatment |
|---|---|---|
| **A — Primary** | The intelligence brief (`.summary-card`), app chrome | Rich navy gradient wash, hairline top accent, refined corner brackets, strongest depth |
| **B — Secondary** | Standard analysis panels (`.ws-card`) | Solid deep-navy surface, hairline border, soft shadow, headed-section anatomy |
| **C — Tertiary** | Embedded content (feed items, rank rows, highlight cards, health tiles, region tiles, chips, KV rows) | Inset fill, inner hairlines — visibly *inside* a level-B panel |

The level-B panels keep identical dimensions and grid positions; only their material changes, and their interiors gain a distinct inset vocabulary so the screen reads as **one composed dossier** rather than many identical boxes.

## 4. Color tokens

### Dark (default)

| Token | Old | New | Rationale |
|---|---|---|---|
| `--bg` | `#070B14` | `#05080F` | Deeper ink navy — quieter, more premium base |
| `--text` | `#FFFFFF` | `#EDF2FB` | Blue-white — softer, calmer, less harsh than pure white |
| `--text-muted` | `rgba(255,255,255,.45)` | `rgba(151,170,205,.56)` | Cool slate — better legibility on navy |
| `--card` / panels | white-alpha `rgba(255,255,255,.06)` | solid navy `rgba(15,25,46,.92)` | Opaque material, no wash |
| `--glass-bg` (level B) | white-alpha gradient | `linear-gradient(165deg, #101B31, #0B1324)` | Deep navy panel material |
| `--glass-strong` | `rgba(255,255,255,.1)` | `linear-gradient(165deg, #16223C, #0D1730)` | Slightly raised level-B |
| `--border` | `rgba(255,255,255,.08)` | `rgba(151,178,255,.10)` | Blue-tinted hairline — the premium cue |
| `--border-strong` | `.16` | `.20` | Crisp interactive borders |
| `--line-soft` | `.08` | `rgba(151,178,255,.07)` | Inner hairlines |
| `--accent` | `#5EA2FF` | `#6EA8FF` | Slightly cooler, more authoritative |
| `--accent-2` | `#7A5CFF` | `#8B7CF6` | Richer violet partner |
| `--grad` | blue→violet | `#5FA3FF → #82B0FF → #8B7CF6` | Brighter midtone for crisp text-gradients |
| `--shadow-soft` | black + blur | navy-dominant, tighter | `0 1px 0 inset hairline, 0 28px 70px -28px rgba(2,7,20,.85)` |

### Light

Mirrors the same philosophy with navy-tinted light surfaces: `--bg #F3F6FB`, panels solid white `rgba(255,255,255,.92)`, hairlines `rgba(20,40,80,.10)`, same accent family. The light theme keeps full parity — same surfaces, same hierarchy, same signature.

## 5. Typography scale

Inter remains the typeface; mono labels remain the "signature" voice. Scale and rhythm change.

| Element | Old | New |
|---|---|---|
| App page title (`h1`) | `1.6rem / 800` | `2.05rem / 800`, `-0.03em` tracking |
| App page subtitle | `.9rem muted` | `.98rem`, more leading, max-width up |
| Intelligence brief title | `1.02rem` (card-title) | `1.7rem / 700`, `-0.025em` — reads as the headline |
| Brief body text | `.98rem` | `1.02rem`, `line-height 1.8` |
| Section (card) titles | `1.02rem / 600` | `1.06rem / 600`, refined mono kicker above |
| KPI values | `1.85rem` | `2.35rem / 700`, `-0.03em`, mono numerals |
| Micro-labels | `10px, .16em` | `10.5px, .18em`, slate color |

Rhythm: `.app-main` padding grows (30px → 36px, max-width 1440px), `.ws-grid` gap grows (20px → 22px), and `card-head` gains a hairline rule so each panel reads as a *headed section* of a dossier.

## 6. Hierarchy — the intelligence brief as focal point

The AI summary card (`.summary-card`) becomes the hero panel, **without moving or changing its content**:

- Level-A material: richer radial navy/indigo wash, hairline top accent (borrowed from the landing `.brief-panel`), inner 1px ring.
- Corner brackets (via pseudo-elements) — a quiet "framed briefing" signature that reads strategic, not militarized.
- Larger headline scale and a refined status row (live badge + generated note) aligned as metadata.
- The orb is kept but its glow is softened.

Below it, the suggested-actions bar is re-presented as a slim utility strip, and the four KPIs read as a single **metrics row** — consistent label grammar, larger numerals, colored delta chips. The remaining data panels become the "supporting dossier."

## 7. Visual signature — details

- **Kicker labels:** mono uppercase micro-labels (`TRACKING`, `MOMENTUM`, `LIVE`) with `.18em` tracking — the NABD "voice."
- **Live indicator:** a calm pulsing dot, never a blinking banner.
- **Framed brief:** corner brackets only on the primary panel.
- **Sectioned panels:** hairline rule under each panel header → "report" anatomy.
- **Inset content:** all tertiary rows sit on a subtly darker fill with inner hairlines.
- **Settings index:** section cards numbered `01 · …` — configuring a professional system, not flipping app toggles.

## 8. Page applications

### Dashboard
- **App head** — larger title, editorial subline, breathing room.
- **Quick actions** — lighter "command row" treatment; less card-like, more tappable.
- **Query dock** — full-width refined search field (hairline, deeper inset), richer focus state.
- **Analysis workspace** — hero brief (level A) → actions strip → metrics row → dossier of headed sections (level B) → inset content (level C).

### Profile
- Presented as an **analyst dossier**: level-A header with avatar, name, verification, and primary identity line; refined KV as a definition grid; operational stats with mono numerals; activity timeline; navigation as elegant list rows. Same data, same IDs, same controls.

### Settings
- Sections numbered and treated as a **system configuration console**: refined rows with hairline separators, premium switches, a quiet danger-zone panel. Same settings, same flows, same IDs.

## 9. Non-goals

- No new features, widgets, or controls.
- No reordering of the workspace grid or its children.
- No changes to navigation, auth, exports, or data contracts.
- No change to information architecture or any user flow.
- No cyberpunk/gaming styling, no heavy neon, no gratuitous motion.
