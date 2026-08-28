# Margin Agent State

## Project
Name: Margin
Type: Vanilla JS + Vite typing practice app
Primary context file: repomix-output.xml

## Completed Phases
- repomix context generation: COMPLETE
- awesome-cursorrules frontend rules: COMPLETE
- browser-use visual research: COMPLETE
- styling-foundation: COMPLETE
- color-expert audit (secondary): COMPLETE
- premium-ui: COMPLETE (re-executed with browser verification)
- visual polish (impeccable-design-polish, secondary): COMPLETE
- minimalist refinement (minimalist-skill, secondary): COMPLETE

## Completed Artifacts
- DESIGN_RESEARCH.md: CREATED
- DESIGN_BRIEF.md: CREATED (updated with research validation)
- COLOR_SYSTEM.md: CREATED (light palette applied + verified dark spec)

## Active Rule Files
- .agent/ACTIVE_RULES.md
- .agent/FRONTEND_RULES.md

## Current Phase
motion-polish (next)

## Next Skills Queue
1. motion-polish
2. chrome-devtools-mcp audit

## Locked Constraints
- No framework — vanilla JS + Vite
- No heavy animation during typing — transform/opacity only, ≤250ms
- Never weaken the DOMPurify sanitisation path
- Never remove or weaken Vitest tests
- Respect prefers-reduced-motion
- Premium design must remain calm, fast, and readable

## Verification Log — premium-ui (2026-08-29, headless Chromium @ 1440×900)
Ran against the dev server (`tools/verify.mjs`, screenshots in `tools/after/`, `tools/a11y.mjs` for axe + newline state).
- Brand title `clamp(4.25rem,8.5vw,7.75rem)` → 122.4px at 1440; `.eyebrow` 11.04px (was 9.6).
- `.document-preview` `min-height: 260px` → box 377px for a 4-line doc (was a 132px box with 54px of padding).
- Selection bar border-top when a range exists: `rgb(34,75,60)`; dormant primary `rgb(34,75,60)` on `--paper` = **6.24** contrast (was forest-on-forest, illegible), `aria-disabled` flips with selection.
- Idle `.typing-shell` 516px → **432px** (`height: min(48vh, 470px)`); controls land ~42px below the panel, not ~190px.
- `.success-label` `margin-left: 0.9rem` → 14.4px gap (was 1.9px, touching).
- Overlay entry moves focus to `#overlayActionButton` (Tab→Space path); post-Start focus `#typingPassage`.
- Incorrect char while typing: `animation none 0s`, colour `rgb(135,47,34)` (was white-on-white); `#resultsErrorIndex` now points at the failing char itself (33 vs cursor 34).
- `wpm` at `elapsedMs 0` → 0.
- Non-destructive confirm ("Remove one word from practice") is `button-primary / rgb(34,75,60)`; destructive remains rust.
- Tab order skip→home→library→sound→volume→fileInput; focus ring `rgb(166,110,49)` (3.81:1 on paper).
- Reduced motion: every transition/duration **1e-05s**. Mobile 360 and 320: horizontal overflow 0.
- `npx vite build` ✓ · `npx vitest run` 22 passed / 3 failed (pre-existing `upload.spec.js` fixture-path baseline, unchanged) · axe-core **0 violations** · **0** console errors.

## Verification Log — visual polish (2026-08-29, `tools/audit.mjs` census before + after)
22 focused edits, one regression found and reverted, six audit findings rejected as false alarms.

| Area | Change |
| --- | --- |
| **Column alignment** | New `--col-width: 850px` + `--col-pad: 1.1rem`. `.document-preview` max-width uses the token; `.document-meta` and `.selection-bar` (were `max-width:none` / full-bleed) take `calc(var(--col-width) + var(--col-pad)*2)` + `padding-inline: var(--col-pad)`. Meta, panel and bar now share edges 277.41 / 1162.6 (was three right edges: 1145.0 doc panel / 1232.0 meta row / 1240.0 bar). Header deliberately stays wider (nav). |
| **Button height (regression → reverted)** | The premium pass had added `.selection-actions .button { flex: 1 1 0 }`. Measured: both buttons 53.75px at 1440 (56px natural, one line, 12px empty inside) and 66px at 360. The equal-width rule *caused* the raggedness it was meant to fix — **removed**. Both are now 44px on one line everywhere (1440: 197.3 / 151.6 natural widths; 360: 140.8 each via the bar's column+stretch). |
| **Dormant treatment** | Disabled `#practiceMistakesButton` gains `button-dormant aria-disabled="true"` in the markup; the CSS-only dormant rule never applied to a primary without the class. |
| **Drop zone** | `.drop-zone` border `1.5px` → `2px` (1.5px rasterised as a hairline, so the primary affordance read as un-drawn); `.file-type` weight `900` → `800`; `::before` photo opacity `.42` → `.34`; mobile `.import-composition` padding `clamp(3rem,7vw,7rem) 1rem`. |
| **Typing rhythm** | `.session-controls` margin-top `1.2rem` → `1rem`: gap shell-bottom→controls 11.2px → 16px (a full step of the 4px scale). |
| **Mistake rows** | padding `1rem 2.25rem` → `1rem 1.5rem`; `.remove-word` padding `.45rem .5rem` + `margin: -.45rem -.5rem -.45rem auto` → tap target 14px → **26px** tall, row still 54px. |
| **Micro-type ladder** | Rendered small-text sizes were `.67 .69 .69 .73 .74` (6 values ≤.75rem with no ratio between them) → consolidated to `.70/.72/.72/.75/.75/.70` (px equivalents .69/.71/.73/.75). Only remaining off-ladder size: `.success-label .74rem`. |
| **Radius / motion language** | `kbd` radius `4px` → `2px`; `nav` transition `ease` → `ease-out` to match the app's move language. |
| **Overlay token** | `--overlay-surface: rgba(255,253,248,.94)` named for `.session-overlay` — the same value the design already produced; documentation, not a visual change (see rejected findings). |
| **WPM readout** | `src/core/statistics.js`: running WPM clamped to 0 for the first second so the first drawn number is real. Logic, not styling — fixed because it is a visible readout defect. |

### Audit findings rejected — deliberately NOT changed
- **Library empty-state "hole" (392px of blank space)** — my own audit injected `.mistake-item` rows into the live section, bypassing `renderLibrary()`, which is what hides `#libraryEmpty` (`src/main.js:638`). Not a defect.
- **`Close` has no focus ring / `context: undefined`** — same cause: a button I injected into the dialog.
- **`.icon-button` 34px vs the 44px standard** — intentional and documented in DESIGN_BRIEF §11.17 for the header cluster.
- **`.document-preview` padding / line length** — 73–88 CPL is already in range for a reading tool; `clamp(2.5rem,8vw,7rem)` is a brief-stated value.
- **Overlay "ghosting"** — I first claimed passage text bleeding through the idle overlay was a defect and shipped `blur(9px)` + a stronger scrim. Measured before vs after on identical state: variance 1262.5 → 1265.3, dark-pixel fraction identical (0.0364). The scrim's `rgba(ink,.42)` over the light stage already lands at ~0.95 luminance, so the wash **is** the design; and `backdrop-filter` cannot be measured in this headless renderer at all. **blur reverted to the original 5px**; only the named token was kept.
- **Selection-bar copy** — I shortened "Practice entire document" → "Practice all" to fix the height, then **reverted it**: this pass is styling-only and the copy is the app's own.

### Polish verification (1440×900 + 360/320)
- Preview min-height 377 · bar border-top `rgb(34,75,60)` · dormant button `aria-disabled=false` when enabled · `#removeAllMistakesButton` 38px (small button) · mistake row 920×54 with a 26px remove target
- Focus: after import → `#documentPreview` · overlay entry → `#overlayActionButton` · after Start → `#typingPassage` · ring `rgb(166,110,49)`
- Incorrect char `animation none 0s` / `rgb(135,47,34)` · newline marker `display:inline`, `min-width:0`, same line as the preceding char
- axe-core 0 violations · 0 console/page errors · horizontal overflow 0 at 320 · `vite build` ✓ 2.98s · `vitest run` 22/3 — identical to the pre-existing baseline

### Next phase should start from these numbers, not from a fresh scan
- 4px spacing scale; micro-type ladder floor `.70rem`; radius set `2 / 3-4 / 9-10 / 13 / pill / 999`; hairline `1px`, control border `2px`.
- Every `.button` is 44px (`.button-small` 38px) at one line; `.text-button` 35.4px; `.icon-button` 34px by design.
- Typing surface: `height: min(48vh, 470px)`, `padding: clamp(2.25rem,5vw,3.5rem)`, controls `margin-top: 1rem`.
- Reading column: `--col-width: 850px`, shared by the document panel, the file meta row and the selection bar.

## Verification Log — minimalist refinement (2026-08-29, `tools/min_ab.py` + `tools/min.mjs`)
Skill: `Margin/.claude/skills/minimalist-skill/SKILL.md` — **it exists**, despite the init note saying the folder was absent. Its palette/typography/flatness rules were already met by the app (`#f5f1e8` bone, Georgia + Inter, muted pastels, 1px hairlines, no gradients, no pill-rounded containers); the pass enforced its *restraint* clauses.
No application logic was touched. `src/main.js` is unchanged by this pass.

### Measured A/B (1440×900, rendered, pre-state reconstructed by inverting the pass's own edits)
| Stage | rendered nodes | shadow-casting | bordered | decorative pseudo | accent hues |
| --- | --- | --- | --- | --- | --- |
| import | 22 → **20** | 1 → **0** | 4 → **3** | 2 → **1** | forest, gold, ink → **gold, ink** |
| select | 24 → **22** | 1 → **0** | 6 → 6 | 0 → 0 | forest, gold, ink |
| type | 34 → 34 | 1 → **0** | 8 → 8 | 0 → 0 | forest, gold, ink, rustText |

`tools/verify.mjs` + `tools/a11y.mjs`: axe **0 violations**, 0 console errors, overflow 0 at 880/620/360/320, focus rings intact (`documentPreview` and `typingPassage` both `solid 1px rgb(145,170,153)` when focused), reduced motion 1e-05s, `vite build` ✓, `vitest` 22/3 = pre-existing baseline.

### Removed / simplified
- `.import-stage::before` ruled-paper texture deleted; the 'M' watermark kept but recoloured `rgba(34,75,60,.028)` → `rgba(31,41,37,.022)` (one ambient layer, not two).
- `.brand-title` `color: var(--forest)` → `var(--ink)`; hero scale/weight carry the hierarchy, so the CTA colour stops competing with it.
- Shadows dropped from `.drop-zone`, `.parse-status`, `.document-preview`, `.typing-shell` — panels now rest on border + surface tint (white on paper). The app paints **zero** shadows inside `main`; only the two dialogs (`--shadow-modal`, lightened 0.35 → 0.24) and the toast (`--shadow-soft`) float, which is correct.
- `.selection-bar.has-selection` lost its `border-top-color: var(--forest)` glow; the dot + "N words" + active primary already signal selection. `.selection-dot` lost its `0 0 0 5px` halo.
- `.file-type` chip border `var(--sage)` → `var(--surface-border)` (it was a second frame around an already-boxed label).
- `.success-label` ("● Ready") deleted from markup + CSS: static, never changes, states nothing the loaded panel doesn't.
- `.privacy-lock` CSS-drawn padlock deleted with its markup; the sentence stands.
- `.empty-rings` triple concentric ring → one 1px sage ring.
- `.advisory`: gold 3px rule + solid `#f7edd7` plate → 2px sage rule over `color-mix(advisory-bg, transparent 45%)`.
- Header: rule `transparent 20%` → `45%`, `blur(16px)` → `blur(10px)`.
- Density: `.document-preview` padding `clamp(2.5rem,8vw,7rem)` → `clamp(2.25rem,6.5vw,6rem)`; `.typing-passage` `clamp(2rem,7vw,5.5rem)` → `clamp(1.85rem,5.5vw,4.5rem)`.
- Focus during typing, CSS-only (no new app state):
  `.type-stage:has(.typing-passage:focus) .live-stats div { border-right-color: transparent }` and `… .typing-topbar h1 { opacity: .55 }`, `.kicker { opacity: .72 }`.

### Two things this pass got wrong first, then fixed (do not re-introduce)
1. **Dimming small text to force focus.** The first version set `.live-stats { opacity: .5 }` and `.typing-hint { opacity: .75 }`. Composited against `--paper` that is **2.68:1 and 2.49:1** — WCAG failure on live readouts, and axe cannot see it. Rule: recede *rules, fills and large display type*, never small text. The dimmed kicker was then measured properly: `.72` → **4.31:1** (AA pass); the 48px heading at `.55` → 3.42:1 (passes as large text).
2. **A/B against `git HEAD`.** HEAD predates the earlier passes, so it measured the wrong baseline and produced a fake "0 shadows before/after" line. Correct method is `tools/min_ab.py`: invert the pass's own edits, assert every anchor matches exactly once, restore in a `finally`.
3. `tools/verify.mjs` "stats opacity (running)" now reads `1` — intended: the readout is no longer faded while typing.

### Carried to next phase (report-only; not styling)
- **Duplicate keyboard stop on the import control**: Tab 7 → `#fileInput` (the `visually-hidden.file-input:focus-visible` reveal chip), Tab 8 → `#dropZone` (`tabindex="0"` + `main.js:758` keydown). Both are needed — `showStage('import')` focuses `elements.dropZone` (`main.js:114`) and the native input is the labelled control — so the fix is behaviour/copy, not CSS. Left alone.
- **`Mistakes 0` badge stays solid `--rust`** even at zero count — an alert colour on an empty state. Fixing it needs a class toggle in `main.js:611-613` (outside this pass).
- Duplicate Start affordance (overlay button + `#startPauseButton`) and the `.success-label .74rem` off-ladder size from the previous pass are now **moot** — that element was deleted here.

## Current Recommendation
Styling foundation verified — all design tokens, @layer architecture, responsive breakpoints, motion principles, and accessibility features are implemented and passing.
Colour system verified numerically: 19/19 WCAG pass on the semantic pair contract, max chroma 0.123 (no neon); see .agent/COLOR_SYSTEM.md.
premium-ui verified in a real browser (headless Chromium): 0 axe-core violations, 0 console errors, no horizontal overflow at 320px.
Visual polish verified numerically before/after: 22 focused edits, 1 self-inflicted regression reverted, 6 false alarms rejected with measurements.
Minimalist pass verified: zero painted shadows inside main, one ambient layer instead of two, focus-during-typing achieved in CSS alone at AA contrast.
Ready for motion-polish phase — start from the numbers listed above, and treat the overlay wash as intended rather than a defect.

## Known Issues For Next Phase
- **Duplicate Start affordance:** the idle overlay's `#overlayActionButton` and `#startResumeButton` in the control bar are both labelled "Start". The overlay button is the pointer target while `#startResumeButton` is the keyboard/Tab target (`src/main.js:511-513`) — deliberate, but the copy is redundant. Needs a copy/UX decision, not styling.
- **Vitest:** 3 pre-existing failures in `tests/document-parser.test.js` are fixture-path bugs, not UI. The test passes `new URL(...)` where `parseDocument` expects a browser File (URL.toString yields "/tests/fixtures/..."), and the DOCX case needs `tests/fixtures/sample.docx`, which is not tracked in the repo.
- **DESIGN_BRIEF.md §16 is STALE:** it lists as unimplemented the cursor pulse duration, `.char` transition, `is-current` triple-signal, 44px buttons, passage font floor, selection-bar border glow, mistake-item hover, crossfade stage transition, and `--surface-raised`/`--shadow-soft`. All are implemented in `src/styles.css`. Do not re-do that work from the brief; re-derive from source or COLOR_SYSTEM.md.
- **FRONTEND_RULES.md §9** still says "the Tailwind CDN in index.html" — there is no Tailwind link in index.html.
- `statistics.js` now floors WPM until 1000ms has elapsed (sub-second extrapolation reported ~1000 WPM). No test asserted the sub-second case; a regression test is worth adding during motion-polish.
- **1 soft colour miss remains:** selection text over `--selection-bg` is APCA 80.1 (target 85); WCAG is 8.88. Fixable without touching the palette: render selection text in `--ink` rather than `--forest-dark`.
- **Motion-polish input:** only `nav` (opacity) and `.session-overlay` (opacity+scale) declare transitions in the base layer; `prefers-reduced-motion` collapses them to ~1e-05s. The stage crossfade and button/toggle transitions live in later `@layer` blocks, so a motion audit must read all four layers, not just `:root`.

---

*Updated 2026-08-29: visual-polish pass COMPLETE. Note — this file was found reverted to its pre-premium-ui contents at the end of the polish pass (the premium-ui verification log had disappeared); it has been rebuilt with both logs. Re-read it before trusting its history.*
