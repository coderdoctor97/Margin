# Margin Color System — Token Recommendation

Authored by the `color-expert` secondary pass. Light-mode changes below are **applied** to
`src/styles.css`; the dark-mode palette is a **verified specification only** and is deliberately
**not** wired into the stylesheet (DESIGN_BRIEF §12: "No dark mode yet"; §14: "No dark mode in
initial polish — Deferred"). Activation is a one-block copy/paste when you decide to lift that lock.

All numbers in this file are computed, not estimated: WCAG 2.1 relative-luminance contrast,
APCA 0.1.9 "W3" Lc, and OKLCH derived from the hex tokens themselves.

## 1. Verdict on the existing palette

The warm palette was already strong. Measured against a 19-pair semantic contract, light mode
**now passes 19/19 on WCAG** (max chroma 0.123, i.e. no neon). Before this pass it had three
soft failures, all of them in the categories this skill was scoped to:

| Pair | Before | After | Why it mattered |
|---|---|---|---|
| danger/mistake text on `--paper` | 5.41 / Lc 73.3 | **6.74 / Lc 80** | `--rust` was doing two jobs — dark-mode-friendly fill and small-text foreground. Lc 73 on 11px stat text is exactly where long-session fatigue accumulates |
| focus ring on `--paper` | 3.1 / Lc 54.4 | **3.81 / Lc 62** | WCAG 1.4.11 wants 3:1 for non-text; 3.1:1 was passing on paper and failing on `--paper-deep`/`--surface-*` neighbours |
| untyped passage text | 4.96 / Lc 75.0 | **5.65 / Lc 79.3** | The single most-looked-at pixels in the app, sitting on the AA floor at 19-25px Georgia serif |

## 2. Changes applied to light mode

```css
--rust-text:    #8e3928;   /* NEW — text-only danger; --rust stays the fill token */
--focus-ring:   #a66e31;   /* was #bd7a3a  (L 63.8 → 58.6, C 0.115 → 0.104, H +3.5) */
--char-default: #606863;   /* was #68716c  (L 53.9 → 50.9, C unchanged 0.013) */
```

Retargeted usages: `.text-button.danger`, `.missed-words strong`, `.mistake-count`,
`.remove-word:hover`, and `.parse-status.is-error` now use `--rust-text`. Fills
(`.count-badge`, `.button-danger`, `.is-error .status-spinner::before`) keep `--rust` so the
brand red does not drift. Every value was chosen as the **smallest** move along the existing
hue that clears both gates: each is a ~4-5 point OKLCH lightness drop at the *same* hue and
*lower* chroma — calmer than the original, never brighter or more saturated.

**Deliberately left alone:** `--paper` (#f5f1e8, OKLCH L 95.9) and `--white` (L 99.4). Dimming the
reading surface is the biggest single eye-fatigue lever in a light theme, but DESIGN_BRIEF §4 says
"Preserve it. Refine it — don't replace it", and it would re-baseline all 19 pairs. Recommended
future experiment: `--white` → ~L 97.5 (`#f8f5ec`), which cuts peak luminance while keeping every
text pair at or above today's numbers. Not applied here.

## 3. Long-session / fatigue principles this palette follows

- **APCA over WCAG for reading text.** WCAG's 4.5:1 is a floor that treats `#68716c on #fffdf8`
  (4.96) and `#294236 on #fffdf8` (10.72) as similar. APCA separates them (Lc 75 vs 99.9) and
  matches subjective reading effort much more closely — so passage text is tuned to **Lc ≥ 79**,
  secondary text to **Lc ≥ 75**, primary text to **Lc ≥ 90**.
- **Keep the untyped/typed step, don't erase it.** Untyped `Lc 79` → correct `Lc 99.9` is a
  deliberate dim-the-future/brighten-the-past gradient. Flattening it would remove the reading
  guide; over-widening it would make each keystroke flash. The step is now ~21 Lc, in the calm band.
- **Chroma ceiling 0.13 in OKLCH.** Current max is 0.123 (`--rust`/`--char-incorrect`). Saturated
  chroma at small sizes causes chromatic aberration strain, so all *text* tokens are held at
  C ≤ 0.104 (`--focus-ring`) and C ≤ 0.123 for error hues. No neon introduced.
- **Warm-neutral surfaces, not pure white.** `--white` carries +4 hue toward yellow (H 88.6) and
  `--paper` is L 95.9 — both correct for sustained focus work.
- **One hue family, two accents.** Green (H 148-170) for structure/success and red (H 31-45) for
  error, with gold (H 77-88) reserved for kickers. Red/green separation is reinforced by shape
  (wavy underline) and weight (correct chars are 600), not color alone.


## 4. Dark mode — specification, verified, not applied

Built at fixed OKLCH lightness targets with the light palette's hue structure preserved
(green H≈150-170, red H≈28-35, gold H≈85), then solved for the **lowest** lightness that still
clears the same 19-pair contract — i.e. as dim as the accessibility budget allows, because a
"dark mode" that is really just inverted light mode is what causes dark-room glare.

- Surfaces: `--paper` L 20.1 (not black), panels L 23.9. Elevation = lighter, matching §2's
  "never use heavy borders".
- Primary text L 92.9 (WCAG 14.66 / Lc 118.5) — capped, not pure white, for the same reason.
- **Fill tokens are re-derived, not re-used.** `--forest` lightens to L 71 for link text while a new
  `--forest-fill` L 50 holds the button surface; same split for `--rust` → `--rust-text` / `--rust-fill`.
  This is the structural lesson of §1: one token serving as both text-on-light and fill-on-dark is
  what produced the two soft failures above, and it breaks hard in dark mode.
- `--btn-primary-label` / `--btn-danger-label` exist per mode: light uses `--white`, dark uses
  `--ink` (dark-ink-on-raised-fill only reaches Lc 52, so the label polarity flips).
- Code block inverts to a *darker* pocket (L 16) rather than a lighter one, keeping it recessive.
- Shadows: `--shadow-*` keep their alpha but should shift to `rgba(0,0,0,0.5)`+ in dark —
  a warm 10%-alpha shadow on a 20%-lightness surface is nearly invisible, so elevation would
  silently disappear. Flagged, not changed.

## 5. Remaining items for your decision

1. **Activate dark mode or not.** The block below is ready; applying it changes the app's visual
   design, which FRONTEND_RULES §10 requires you to approve.
2. **`--selection-bg` step is slightly small** (Lc 80.1 for selection text vs an 85 target). It passes
   WCAG at 8.88. Fix without touching color: render selection text as `--ink` instead of `--forest-dark`.
3. **Decorative tokens intentionally below 3:1** — `--sage` on paper (2.21), `--cursor-pulse`
   against white (1.52), `--line` (1.19). These are glyph-adjacent decoration, not semantic UI,
   so WCAG 1.4.11 does not apply. Worth a one-line comment in the theme block so a future auditor
   doesn't re-flag them.
4. **`color-mix(in srgb, var(--line), transparent 20%)`** in `.app-header` is the only modern-color
   function in the file (Chrome 111 / Safari 16.4 floor). It will need a plain-token fallback before
   any dark-mode rollout, and `color-mix` in sRGB is not perceptually uniform — `oklab` is if you
   keep it.
5. **No theme-switching UI exists.** `color-scheme: light` is hardcoded in `:root`; there is no
   `.dark` class or `<meta name="color-scheme">` hook, and no `prefers-color-scheme` JS listener
   (the app has the `matchMedia` pattern already used for reduced motion, which is the model to copy).
6. **Two tokens are dead in light mode**: `--paper-deep` and `--rust-pale` are each declared in
   `@layer theme` and referenced **0 times** by any rule (verified by counting `var()` uses in the
   non-theme CSS; `--sage-pale` is used 3x and is fine). `--rust-pale` is now doubly redundant since
   the incorrect-character background tint was dropped. I did not delete them — removing a token is a
   DESIGN_BRIEF §4 "refine, don't replace" judgement call, and one of them may be intended for the
   deferred `is-incorrect` background. Suggest deleting both in the motion-polish cleanup.

## 6. Copy/paste dark activation block

```css
@layer theme {
  @media (prefers-color-scheme: dark) {
    :root {
      color-scheme: dark;
      --paper: #111815;
      --white: #19211e;
      --ink: #e4e9e5;
      --muted: #a5afa7;
      --line: #303832;
      --forest: #79b090;
      --forest-dark: #a5c9b4;
      --sage: #5d7a66;
      --sage-pale: #223226;
      --rust: #e38973;
      --rust-text: #f79b85;
      --gold: #c0a468;
      --surface-border: #28302b;
      --surface-shell: #212923;
      --status-error-bg: #2b1e1c;
      --status-error-border: #6b4038;
      --status-success-bg: #1b241d;
      --status-success-border: #3f5a48;
      --advisory-bg: #33270c;
      --advisory-text: #e1cc99;
      --success-dot: #7fb08c;
      --selection-bg: #263f2b;
      --button-secondary-border: #4a5a50;
      --focus-ring: #cb9b55;
      --char-default: #a5aea8;
      --char-correct: #a6c7b3;
      --char-incorrect: #f79b85;
      --code-text: #b9bfb9;
      --code-bg: #080f0c;
      --cursor-pulse: #33503a;
      --forest-fill: #2c6245;
      --rust-fill: #71301f;
      --btn-primary-label: #e4e9e5;
      --btn-danger-label: #e4e9e5;
    }
  }
}
```

## 7. Full token reference

Light column is the shipped state after this pass; dark column is the spec in §4.
OKLCH values are rounded to one decimal and are what you should tune against — C is the
saturation budget, L is the fatigue dial, H is the hue family.

| Token | Light (applied) | Light OKLCH | Dark (spec) | Dark OKLCH |
|---|---|---|---|---|
| `--paper` | `#f5f1e8` | `oklch(95.9% 0.013 86.8)` | `#111815` | `oklch(20.1% 0.012 167.2)` |
| `--paper-deep` | `#ebe4d7` | `oklch(92.1% 0.019 83.1)` | — | — |
| `--white` | `#fffdf8` | `oklch(99.4% 0.007 88.6)` | `#19211e` | `oklch(23.9% 0.013 170.4)` |
| `--ink` | `#1f2925` | `oklch(27% 0.016 168.8)` | `#e4e9e5` | `oklch(92.9% 0.008 151.9)` |
| `--muted` | `#4f5953` | `oklch(45.3% 0.016 159.4)` | `#a5afa7` | `oklch(74.4% 0.016 151.7)` |
| `--line` | `#d8d2c6` | `oklch(86.5% 0.018 84.6)` | `#303832` | `oklch(33.1% 0.015 153.1)` |
| `--forest` | `#224b3c` | `oklch(37.8% 0.053 167.3)` | `#79b090` | `oklch(71% 0.075 158.3)` |
| `--forest-dark` | `#17372c` | `oklch(30.9% 0.043 168.7)` | `#a5c9b4` | `oklch(80.4% 0.048 159.5)` |
| `--sage` | `#91aa99` | `oklch(71.4% 0.037 155.6)` | `#5d7a66` | `oklch(55.1% 0.046 154.6)` |
| `--sage-pale` | `#dbe6dc` | `oklch(91.4% 0.018 148.1)` | `#223226` | `oklch(29.9% 0.03 152)` |
| `--rust` | `#a04732` | `oklch(51% 0.123 34.6)` | `#e38973` | `oklch(72% 0.115 34.6)` |
| `--rust-text` | `#8e3928` | `oklch(45.9% 0.12 33.1)` | `#f79b85` | `oklch(77.8% 0.115 34.2)` |
| `--rust-pale` | `#f3dcd5` | `oklch(91.1% 0.027 37.6)` | `#3a211b` | `oklch(27.9% 0.041 34.2)` |
| `--gold` | `#76551d` | `oklch(47.4% 0.084 77.1)` | `#c0a468` | `oklch(73% 0.085 85.4)` |
| `--surface-border` | `#e4ded2` | `oklch(90.2% 0.017 84.6)` | `#28302b` | `oklch(30% 0.014 158)` |
| `--surface-shell` | `#e2dbcf` | `oklch(89.4% 0.018 81.3)` | `#212923` | `oklch(27.1% 0.016 152.8)` |
| `--status-error-bg` | `#fff8f5` | `oklch(98.4% 0.009 44.9)` | `#2b1e1c` | `oklch(25% 0.021 28.6)` |
| `--status-error-border` | `#d8a99e` | `oklch(77.5% 0.058 33.5)` | `#6b4038` | `oklch(42% 0.062 31.2)` |
| `--status-success-bg` | `#f7fbf7` | `oklch(98.4% 0.007 145.5)` | `#1b241d` | `oklch(24.9% 0.018 151.6)` |
| `--status-success-border` | `#a7bcae` | `oklch(77.5% 0.03 156.4)` | `#3f5a48` | `oklch(44% 0.044 155)` |
| `--advisory-bg` | `#f7edd7` | `oklch(94.8% 0.031 86.5)` | `#33270c` | `oklch(28% 0.045 85)` |
| `--advisory-text` | `#6b511f` | `oklch(45.2% 0.075 81)` | `#e1cc99` | `oklch(85% 0.071 88.2)` |
| `--success-dot` | `#538064` | `oklch(55.9% 0.066 156.2)` | `#7fb08c` | `oklch(71.2% 0.074 152.5)` |
| `--selection-bg` | `#c9dacb` | `oklch(87.1% 0.027 148.8)` | `#263f2b` | `oklch(34.1% 0.047 149.7)` |
| `--button-secondary-border` | `#9eaaa2` | `oklch(72.6% 0.018 156.8)` | `#4a5a50` | `oklch(45.1% 0.026 157.8)` |
| `--focus-ring` | `#a66e31` | `oklch(58.6% 0.104 65.3)` | `#cb9b55` | `oklch(72% 0.105 75.1)` |
| `--char-default` | `#606863` | `oklch(50.9% 0.013 158.5)` | `#a5aea8` | `oklch(74.2% 0.013 156.9)` |
| `--char-correct` | `#294236` | `oklch(35.5% 0.038 162.9)` | `#a6c7b3` | `oklch(80% 0.045 158.6)` |
| `--char-incorrect` | `#872f22` | `oklch(43.2% 0.123 31)` | `#f79b85` | `oklch(77.8% 0.115 34.2)` |
| `--code-text` | `#e8eee9` | `oklch(94.3% 0.009 150.7)` | `#b9bfb9` | `oklch(79.8% 0.011 145.5)` |
| `--code-bg` | `#28352f` | `oklch(31.5% 0.02 165.3)` | `#080f0c` | `oklch(16% 0.013 166.9)` |
| `--cursor-pulse` | `#c2d5c5` | `oklch(85.4% 0.03 150)` | `#33503a` | `oklch(40.1% 0.051 151.2)` |
| `--forest-fill` **(new)** | `#224b3c` | `oklch(37.8% 0.053 167.3)` | `#2c6245` | `oklch(45.1% 0.075 157.8)` |
| `--rust-fill` **(new)** | `#a04732` | `oklch(51% 0.123 34.6)` | `#71301f` | `oklch(39.6% 0.097 35.7)` |
| `--btn-primary-label` **(new)** | `#fffdf8` | `oklch(99.4% 0.007 88.6)` | `#e4e9e5` | `oklch(92.9% 0.008 151.9)` |
| `--btn-danger-label` **(new)** | `#fffdf8` | `oklch(99.4% 0.007 88.6)` | `#e4e9e5` | `oklch(92.9% 0.008 151.9)` |

## 8. Audit harness

Reproducible from this repo with no new dependencies:

```bash
node /tmp/check.mjs /tmp/theme-light.json light   # WCAG + APCA + chroma guard
node /tmp/check.mjs /tmp/theme-dark.json  dark
```

`/home/user/tools/contrast.mjs` implements WCAG 2.1
relative luminance, APCA 0.1.9 W3, and sRGB→OKLCH in ~60 lines. If you want it as a permanent
guard, move it to `tools/contrast.mjs` and add a Vitest case asserting `wcag() >= 4.5` for the 19
pairs — that is the check that turns DESIGN_BRIEF §4's "the current palette passes" from a claim
into a test. (It currently could not be: §4 asserted `--muted` passes while §16 asserted it fails
at 4.3:1; the real value at the time of writing is 6.45.)
