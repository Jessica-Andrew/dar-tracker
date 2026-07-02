# Design tokens

Source values live in `src/styles/tokens.css` and `tailwind.config.ts`.
This doc is the *usage guide* — when to reach for what.

Two rules that hold everywhere:

1. **Never hard-code a hex, spacing value, or duration.** If you need
   a value that isn't in the tokens, add it to the tokens first.
2. **Prefer semantic aliases over ramp values.** Use `--accent`,
   not `--clay-500`. This keeps future retheming a one-file change.

## Colors

### Palette
- `parchment` — the warm cream family. Background of everything.
- `clay` — terracotta. The primary action color and the "harvest" emphasis.
- `ochre` — warm gold. Secondary accent, the sun.
- `olive` — muted green. Merged tasks, success state. Use sparingly.
- `ink` — dark warm neutrals. All text lives here.
- `danger` — reserved. Only destructive confirmations ("uproot this task?").

### Which stop when
- `100`–`200`: subtle tints, hover fills
- `300`–`400`: raised surfaces (day chip, task dividers)
- `500`: canonical stop, primary usage
- `600`–`700`: hover / pressed / shadow
- `900`: reserved for text or ink

### Semantic aliases (prefer these)
| Token | Use for |
|---|---|
| `--bg-page` | The main surface of every screen |
| `--bg-raised` | Day chip, subtle raised elements on parchment |
| `--bg-inverse` | Dark buttons, primary CTA when NOT using clay |
| `--text-primary` | Body text, headings |
| `--text-secondary` | Descriptions, supporting copy |
| `--text-muted` | Kickers, labels, "optional" hints |
| `--text-placeholder` | Input placeholders |
| `--text-on-clay` | Text on a terracotta button |
| `--accent` | Primary CTAs, emphasis (the italic "harvest") |
| `--border-hairline` | Underline inputs, form field bottom borders |
| `--border-divider` | Between task rows |
| `--border-focus` | Any focused input |
| `--status-success` | "connected" indicator, positive threshold |
| `--status-danger` | Destructive action text |

## Typography

Three families, each with a role:

- **`--font-display` (Fraunces)** — headings, italic emphasis, decorative moments (task time labels, kicker chips). This is where the app's personality lives.
- **`--font-body` (Space Grotesk)** — everything you read as prose: task descriptions, buttons, form labels, body copy.
- **`--font-mono` (JetBrains Mono)** — data only: hours inputs, task IDs. Never for prose, never for headings.

### Type scale
Nine steps, all sized in `rem`. The full jump from `text-base` (14px) to `text-4xl` (58px) is intentional — the hero numeral wants to be *dramatic*, not gently large.

- `text-xs` — kickers ("DAILY RECORD"), captions
- `text-sm` — secondary body, footnotes
- `text-base` — default body text
- `text-md` — form inputs (larger than body so they're comfortable to type in)
- `text-lg` — modal titles, small subheads
- `text-xl` — form section headers ("Plant a task")
- `text-2xl` — screen titles ("Today's harvest")
- `text-3xl` — sign-in title
- `text-4xl` — the hero numeral only

### Kickers
Use `text-xs` + `letter-spacing: var(--tracking-kicker)` + `text-transform: uppercase` + `--text-muted`. The full formula is what makes a kicker read as a kicker.

## Spacing

4px base grid. Nine steps (`space-1` through `space-16`). If you find yourself wanting `space-7`, you probably want `space-6` or `space-8` — the point of a scale is picking, not measuring.

Vertical rhythm inside cards uses `space-3` to `space-4`. Between cards or sections, `space-6` or `space-8`.

## Radii

Six radii + three "organic" ones for seed markers.

- `radius-sm` (6px) — checkboxes, small pills
- `radius-md` (10px) — mini buttons, inline chips
- `radius-lg` (14px) — primary buttons, cards
- `radius-xl` (18px) — modals
- `radius-2xl` (20px) — page-level surfaces

Two "signature" radii — use only where intended:
- `radius-daychip` — the asymmetric day chip only
- `radius-seed-a/b/c` — the three seed marker shapes

Straight corners are avoided everywhere. If something has a corner, it's rounded.

## Motion

**One easing curve for everything reactive**: `--ease-spring`. The slight overshoot is the app's motion signature — every button press, every appearing element uses this. Standard easing (`--ease-standard`) is only for utility fades and opacity changes.

**Durations**:
- `duration-quick` (150ms) — micro-interactions: button press response, hover state changes
- `duration-base` (250ms) — most transitions
- `duration-medium` (350ms) — larger movements: modals opening, task list reordering
- `duration-slow` (450ms) — task-in animation, hero number tickle

**Named animations** (in `tailwind.config.ts`):
- `animate-card-in` — modals entering
- `animate-task-in` — new task appearing in the list
- `animate-tickle` — the hero number nudging when the total changes

**Reduced motion**: all durations shrink to `0.01ms` at the token level when `prefers-reduced-motion: reduce` — this cascades automatically to every animation. Don't add per-component reduced-motion checks; the tokens handle it.

## Shadows

Warm shadows only, no pure black.

- `shadow-button` — the 3px hard-edge shadow beneath the terracotta button. The button's tactile identity.
- `shadow-button-hover` / `shadow-button-active` — the shadow shifts on interaction (grows on hover, collapses on press). See the button component's transform + shadow pairing.
- `shadow-card` — the modal card's warm halo. Never used elsewhere.

## Grain texture

Applied as a `::before` pseudo-element on any parchment surface, using `--grain-color`, `--grain-opacity`, and `--grain-size`. Values are calibrated to be *just barely there* — you shouldn't see the grain, you should feel it.

Standard implementation:

```css
.surface::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: var(--grain-opacity);
  background-image: radial-gradient(var(--grain-color) 0.5px, transparent 0.5px);
  background-size: var(--grain-size) var(--grain-size);
  pointer-events: none;
}
```

## Extending the tokens

When you genuinely need a new value (not "I couldn't find one that fits" but "this is a new concept"):

1. Add it to `tokens.css`
2. Mirror it in `tailwind.config.ts`
3. Document it here with a *usage rule*, not just a description

If you can't write the usage rule, the token isn't earning its place yet.
