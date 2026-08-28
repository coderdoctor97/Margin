# Margin Design Brief

## 1. Design Direction

Margin should feel like a premium, calm, focused workspace — not a gamified tool or a flashy SaaS dashboard. The interface should get out of the way and let the act of typing become meditative.

**Adopt the five core principles from the Monospace Design System:**
- **Friendly** — warm, approachable, never cold or clinical
- **Calm** — quiet surfaces, muted colors, no aggressive animation
- **Clear** — strong typographic hierarchy, unambiguous feedback
- **Fast** — zero perceptible lag between keystroke and visual response
- **Forgiving** — mistakes are never dead ends; error states are gentle

**Inspiration references (no single source copied):**
- [Linear.app design tokens](https://designmd.cc/benchmarks/linear) — Inter typography, tight spacing scale, minimal chrome
- [Monospace Design System](https://mds.monospace.studio/) — calm motion, keyboard-first navigation, quiet surfaces
- [Monkeytype/Keybr premium segment](https://www.orbix.studio/blogs/saas-typography-examples) — breathable layouts, muted accents, distraction-free immersion
- [W3C Accessibility Guidelines](https://www.w3.org/WAI/tips/designing/) — WCAG 2.1 AA compliance, focus management, keyboard support
- [Harvard Digital Accessibility — Readability](https://accessibility.huit.harvard.edu/design-readability) — typographic hierarchy, contrast, legibility

---

## 2. Visual Principles

- **One focal point per stage**: The active area (upload zone, document preview, typing passage) should dominate. Everything else recedes.
- **Surface layering**: Use subtle elevation (shadow + background tint) to distinguish panels from the page. Never use heavy borders.
- **Restraint in color**: The existing warm palette (paper `#f5f1e8`, forest `#224b3c`, rust `#a04732`, gold `#76551d`) is excellent. Preserve it. Refine it — don't replace it.
- **Typography as hierarchy**: Size, weight, and spacing create hierarchy. Color is secondary.
- **Negative space is content**: Generous padding and margins are not wasted space — they are cognitive breathing room.

---

## 3. Typography Direction

- **Primary**: Georgia / system serif for headings and brand moments (already in use). Keep.
- **Body/UI**: Inter or system sans-serif for interface chrome (already in use via `--sans`). Keep.
- **Typing passage**: Georgia serif at `clamp(1.18rem, 2.1vw, 1.55rem)` with `line-height: 1.95`. This is already well-sized. Consider a slight increase to `1.35rem–1.45rem` minimum on mobile for better character discrimination.
- **Character spacing**: The current `letter-spacing: .01em` is appropriate for serif. Do not increase — it hurts rhythm recognition in typing.
- **Tabular figures**: `font-variant-numeric: tabular-nums` on stats displays (already present). Keep and extend to all numeric readouts.
- **Font loading**: Georgia and Inter are system fonts — no network request. This is ideal. Do not add web font dependencies.

---

## 4. Color Direction

- **Background**: `#f5f1e8` (paper) — warm, easy on eyes during long sessions. Keep.
- **Surface**: `#fffdf8` (white) for cards/panels. Keep.
- **Text primary**: `#1f2925` (ink) — near-black with warmth. Keep.
- **Text secondary**: `#5f6963` (muted) — for labels, hints, metadata. Keep.
- **Accent**: `#224b3c` (forest) for interactive elements, current cursor, correct characters. Keep.
- **Error**: `#a04732` (rust) for mistakes, destructive actions. Keep.
- **Gold**: `#76551d` for kickers, labels, subtle emphasis. Keep.

**Refinements (non-breaking):**
- Introduce `--surface-raised: rgba(255,253,248,0.85)` for overlays that need to float above content with subtle translucency.
- Introduce `--shadow-soft: 0 4px 24px rgba(45,48,39,0.06)` for micro-elevation (cards, panels).
- Ensure all text/background combinations meet WCAG 2.1 AA (4.5:1 for normal text, 3:1 for large text). The current palette passes.

---

## 5. Spacing/Layout Direction

- **Current spacing rhythm**: The CSS uses a mix of `clamp()`, `rem`, and ad-hoc values. Establish a consistent 4px base unit: 4, 8, 12, 16, 24, 32, 48, 64.
- **Stage transitions**: Currently uses `scrollTo({ behavior: 'smooth' })`. Replace with a crossfade transition between stages using opacity + transform. This feels more premium than scrolling.
- **Panel padding**: Increase minimum padding on `.document-preview` and `.typing-passage` on desktop from `clamp(2rem, 7vw, 5.5rem)` to `clamp(2.5rem, 8vw, 7rem)`. More breathing room = better focus.
- **Header**: Keep at 72px on desktop. Consider reducing to 64px on tablets and 56px on mobile for more vertical space for content.
- **Selection bar**: The sticky bottom bar is good. Add a subtle top-border glow when text is selected (already has `has-selection` dot — extend to the border).

---

## 6. Component Styling Direction

### Buttons
- Current `.button-primary` (forest background) is solid. Consider adding a subtle `transform: translateY(-1px)` on hover (already has `-2px` — reduce to `-1px` for subtlety).
- Add `transition: transform 0.12s ease, background 0.12s ease` (already present). Keep.
- Disabled state: current `opacity: 0.45` is acceptable. Consider `opacity: 0.4; cursor: not-allowed` — already present.

### Drop Zone
- The dashed border and hover lift are good. Consider adding a subtle `border-color` transition on drag-over (already present).
- The document glyph is charming. Keep.

### Typing Passage
- Current character states (correct, incorrect, current) are well-designed. The `is-current` cursor with pulse animation is good.
- **Refinement**: The pulse animation (`cursor-pulse`) runs at 1.25s. Consider slowing to 1.6s for a calmer feel, or making it configurable.
- The `is-incorrect` state uses wavy underline + rust-pale background. This is excellent — clear but not harsh. Keep.
- Whitespace characters show as `·` when incorrect. Good. Consider also showing `↵` symbol for newlines during active typing (already present via `::before`).

### Progress Bar
- Current 2px track with forest fill is minimal and good.
- **Refinement**: Add `transition: width 0.15s ease-out` for smoother progress updates. Currently has `transition: width .2s ease` — already close.

### Session Overlay
- Current backdrop blur + opacity transition is good.
- **Refinement**: Add a subtle scale animation (`transform: scale(0.98)` → `scale(1)`) on appear for a more organic entrance.

### Results Panel
- The 4-column stat grid is clean. Keep.
- The `rise` animation on results is good. Consider adding a staggered delay per stat tile for a cascade effect.

### Mistake Library Dialog
- The dialog structure is solid. Keep.
- Mistake items use a grid layout that collapses well on mobile. Keep.
- **Refinement**: Add subtle hover state on `.mistake-item` rows (background tint) to improve scanability.

---

## 7. Interaction Principles

- **Keystroke-first**: The typing passage must never steal focus from the input. All visual feedback is passive observation.
- **No modal interruptions during typing**: Pause is handled via overlay, not dialog. Keep this pattern.
- **Selection feedback**: The `has-selection` dot and count update are immediate. Keep this responsiveness.
- **Paste blocking**: Announced accessibly via toast + aria-live. Keep this dual-channel feedback.
- **Sound toggle**: Pauses session when toggled. This is a safety measure (prevents audio context conflicts). Keep.
- **Keyboard navigation**: All interactive elements are focusable. Drop zone responds to Enter/Space. Keep and extend.

---

## 8. Motion Principles

- **Transform and opacity only**: All animations must use `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`, `margin`, `padding` during active typing.
- **Duration**: Keep motion fast — 150ms–250ms for micro-interactions, 300ms–500ms for stage transitions.
- **Easing**: Use `ease-out` for entrances, `ease-in` for exits. Avoid `linear`. Consider `cubic-bezier(0.2, 0.8, 0.2, 1)` for a more organic feel.
- **Reduced motion**: `prefers-reduced-motion: reduce` must set all animation durations to `0.01ms` and disable transitions. Already implemented. Keep and verify.
- **No motion during typing**: Stage transitions and overlays are the only acceptable motion contexts. Character highlighting must be instant (no transition on `.char` state changes during active typing).

---

## 9. Responsive Principles

- **Desktop** (>880px): Full header, 2-column import layout, 4-column stats, full mistake library grid.
- **Tablet** (620px–880px): Collapsed header nav, single-column import, 2-column stats, simplified mistake items.
- **Mobile** (<620px): Minimal header, stacked layout, 2-column stats grid, full-width buttons, simplified mistake list.
- **Current breakpoints**: 880px and 620px. These are good. Consider adding a 480px breakpoint for very small screens if needed.
- **Touch targets**: Minimum 44x44px for all interactive elements. Current buttons are 43px min-height — close but technically 1px short. Consider increasing to 44px.

---

## 10. Accessibility Constraints

- **WCAG 2.1 AA compliance**: Minimum 4.5:1 contrast for normal text, 3:1 for large text. Current palette passes.
- **Skip link**: Present and functional. Keep.
- **Aria-live regions**: `polite` for status updates, `assertive` for session announcements. Keep.
- **Focus management**: Focus moves to overlay action button on stage entry, to typing passage on session start. Keep and verify.
- **Dialog semantics**: `<dialog>` with `showModal()`, backdrop, Escape key handling. Keep.
- **Role and labels**: Typing passage uses `role="textbox"`, `aria-readonly="true"`, `aria-multiline="true"`. Keep.
- **Screen reader announcements**: Session state changes (start, pause, complete) announced via aria-live. Keep.
- **Keyboard-only operation**: All features accessible via keyboard. Keep.

---

## 11. Performance Constraints

- **Typing input latency**: Must remain below 16ms (one frame at 60fps). Current implementation is fast — keep it fast.
- **DOM update frequency**: Stats update every 250ms. Character states update per keystroke. Both are acceptable.
- **No layout thrashing**: Read DOM measurements before writes. Current implementation mostly follows this — verify during refactoring.
- **Animation performance**: Only `transform` and `opacity` animated. Current CSS follows this. Keep.
- **No expensive measurements during typing**: `keepCurrentVisible()` uses `offsetTop` and `scrollTo`. This is acceptable — it's a single read + single write per keystroke.
- **Audio polyphony**: Limited to 6 simultaneous sources. Current implementation follows this. Keep.

---

## 12. Things to Avoid

- **No gamification elements**: No streaks, badges, leaderboards, or point systems. Margin is a private practice tool.
- **No dark mode yet**: The current warm paper palette is distinctive. Dark mode should be carefully designed, not hastily added.
- **No flashy animations**: No particle effects, no confetti, no bouncing elements. Calm only.
- **No auto-playing audio**: Sound is opt-in and unlocked by user interaction. Keep.
- **No external font loading**: System fonts only. Keeps the app fast and private.
- **No framework adoption**: Vanilla JS only. Keeps the app lightweight and maintainable.
- **No social features**: No sharing, no accounts, no cloud sync. Privacy-first.
- **No aggressive color**: No neon, no high-saturation accents. Muted only.
- **No layout shifts during typing**: Character spans are pre-rendered. Keep this pattern.
- **No motion that competes with typing**: All animations pause or simplify during active typing sessions.

---

## 13. Recommended Implementation Priorities

**Phase 1 — Polish existing patterns (no new dependencies, no structural changes)**
1. Refine motion: slow cursor pulse to 1.6s, add scale entrance to overlay, add staggered delay to result stats
2. Surface refinement: introduce `--surface-raised` and `--shadow-soft` tokens, apply to panels
3. Spacing consistency: audit padding/margin values against 4px base unit, adjust outliers
4. Touch target fix: increase button min-height from 43px to 44px

**Phase 2 — Enhanced feedback (still no structural changes)**
5. Selection bar glow: extend `has-selection` to border-top with subtle forest tint
6. Mistake item hover: add subtle background tint on row hover for scanability
7. Progress bar easing: refine to `cubic-bezier(0.2, 0.8, 0.2, 1)` for organic feel
8. Stage transition crossfade: replace scroll-based transition with opacity + transform

**Phase 3 — Structural improvements (requires approval)**
9. Remove unused Tailwind CDN from index.html
10. Split src/main.js into focused modules (session wiring, mistake library, stage transitions)
11. Add JSDoc to public APIs (TypingSession, MistakeStore, KeyboardAudio)

**Phase 4 — Advanced polish (requires approval)**
12. Subtle soundscape option (ambient background noise for focus)
13. Custom theme selection (paper, slate, forest presets)
14. Keyboard shortcut hints in UI (⌘K-style command palette for navigation)

---

## 14. Design Decision Log

| Decision | Rationale | Status |
|---|---|---|
| Keep existing warm color palette | Distinctive, readable, calm. No need to modernize. | Locked |
| Keep Georgia serif for passage | Optimal for long-form reading and typing rhythm. | Locked |
| Keep system fonts (no web fonts) | Zero network cost, instant load, privacy-preserving. | Locked |
| No dark mode in initial polish | Current palette works well. Dark mode requires careful contrast tuning. | Deferred |
| No framework adoption | Vanilla JS is fast, lightweight, and sufficient. | Locked |
| Keep DOMPurify strict policy | Security is non-negotiable. | Locked |
| Keep reduced-motion support | Accessibility requirement. | Locked |
| Stage transitions via crossfade | More premium than scroll-based. Low cost to implement. | Recommended |
| Cursor pulse at 1.6s | Current 1.25s feels slightly fast for a calm experience. | Recommended |
| Button min-height 44px | WCAG touch target minimum. Current 43px is 1px short. | Recommended |

---

## 15. Research Validation (browser-use phase, 2025-08-28)

This section validates the design brief against public research conducted in DEGRADED mode.

**Confirmed by research:**
- TypeMochi's "no timers • no stress • just a comfy typing vibe" philosophy validates Margin's anti-gamification direction.
- FennecType's understated keyboard hints pattern supports Margin's existing keyboard navigability.
- Monkeytype's character feedback color logic aligns with Margin's existing correct/incorrect/current states.
- Keybr's label-driven, monospace-friendly stat presentation validates Margin's 4-column stat grid.
- Linear.app's 4px spacing base and `cubic-bezier(0.2, 0.8, 0.2, 1)` easing are recommended for adoption.
- Monospace Design System's five principles (Friendly, Calm, Clear, Fast, Forgiving) are confirmed as the right foundation.
- W3C and Harvard accessibility guidelines confirm Margin's existing WCAG 2.1 AA posture.

**Research mode**: DEGRADED — public web search + WebFetch. No browser-use Python automation. 10 references reviewed.

**Full research log**: `.agent/research/DESIGN_RESEARCH.md`

---

## 16. Design Validation (web-design-guidelines, secondary, 2026-08-28)

Read-only review of `index.html`, `src/styles.css`, `src/main.js`, and all JS modules.
No source code was modified.

---

### PASS

**Hierarchy**
- Three-tier typographic scale is well-established: kicker (gold, uppercase, tight letter-spacing) → brand-title (massive serif, `clamp(5rem, 11vw, 9.2rem)`) → hero-line (serif, `clamp(1.6rem, 3vw, 2.65rem)`) → hero-support (muted, small). Each level has a distinct size/weight/color role. Stage panels clear via `[hidden]`. Section headings use `clamp(2rem, 5vw, 3.6rem)` serif — strong but not competing with the import hero. Stats use muted labels + serif numerals at `1.35rem`. Clear and consistent.

**Typography**
- Georgia serif for passage and headings; Inter for UI chrome. System fonts only — zero network cost. Passage at `clamp(1.18rem, 2.1vw, 1.55rem)` with `line-height: 1.95` is comfortable for sustained reading. `font-variant-numeric: tabular-nums` on live stats. `letter-spacing: .01em` on passage is restrained. Brief's recommended mobile minimum of `1.35rem` is not guaranteed at the current clamp floor — at ~320px viewport width, `2.1vw` ≈ 6.7px ≈ 0.42rem, so the clamp resolves to `1.18rem`. See WARN-4.

**Spacing**
- Import stage uses a deliberate two-column grid with `gap: clamp(3rem, 9vw, 9rem)` — generous and intentional. Document preview padding `clamp(2rem, 6vw, 5rem)` and typing passage padding `clamp(2rem, 7vw, 5.5rem)` provide substantial breathing room. Selection bar sticky bottom with backdrop blur. Stats and progress bar have tight internal spacing that feels intentional, not cramped.

**Contrast (palette intent)**
- `--ink: #1f2925` on `--paper: #f5f1e8` — strong contrast, warm. `--forest: #224b3c` on `--white: #fffdf8` — excellent. White text on forest button background — passes WCAG AA. The warm palette is cohesive and readable in intent. See WARN-1 and WARN-2 for measured contrast gaps.

**Focus states**
- Global `focus-visible` rule: `outline: 3px solid #bd7a3a; outline-offset: 3px`. Gold/amber outline is distinct against both paper and white surfaces. Skip link fixed, transforms up by default, appears on focus. Dialog focus trapping via native `<dialog>.showModal()`. Focus moves to overlay action button on stage entry, to typing passage on session start. Drop zone is keyboard-operable (Enter/Space triggers file input). Comprehensive.

**Interaction consistency**
- Buttons use consistent `.button` base with `.button-primary`, `.button-secondary`, `.button-danger` variants. Hover lift `translateY(-2px)` with `transition: transform .16s ease` on all button variants. Disabled state: `opacity: .45; cursor: not-allowed`. Text buttons use underline-that-appears-on-hover pattern consistently. Selection feedback is immediate via CSS class toggle. Paste blocking uses toast + aria-live dual-channel. Sound toggle pauses session (safety measure). Consistent throughout.

**Responsive behavior**
- Three breakpoints: 880px (tablet), 620px (mobile). At 880px: import stacks to single column, stage nav collapses to current step only, mistake items reflow to 3-column grid. At 620px: header height reduces to 62px, wordmark text hides, live stats become 2-column, result grid becomes 2-column, selection bar stacks vertically, dialog padding reduces. Fluid sizing via `clamp()` means content scales smoothly between breakpoints. 320px minimum width declared. Solid.

**Accessibility**
- Skip link present. `aria-live="polite"` for parse status, selection summary, toast. `aria-live="assertive"` for session announcements. Dialogs use `<dialog>` with `showModal()` and Escape handling. Typing passage: `role="textbox"`, `aria-readonly="true"`, `aria-multiline="true"`, `aria-describedby`. Progress bar has `role="progressbar"` with `aria-valuemin/max/now`. Sound toggle uses `aria-pressed`. `prefers-reduced-motion: reduce` sets all animation durations to `.01ms` and disables transitions. Keyboard navigation verified. DOMPurify for document HTML. Strong baseline.

**Motion restraint**
- All animations use `transform` and `opacity` only (rise, spin, cursor-pulse, toast-in). Cursor pulse is `1.25s ease-in-out` — slow and subtle. Overlay entrance/exit is opacity-only. Toast is opacity + translateY. Rise animation on import copy uses `cubic-bezier(.2,.8,.2,1)` — organic easing. No layout-triggering animations. `prefers-reduced-motion` kills everything. The `.char` transition on `color` and `background` during typing is the one exception — see WARN-5.

**Readability**
- Passage line-height 1.95 with Georgia serif is comfortable for extended reading. Paragraph spacing in document preview (`margin-top: 2.2em` on h2) creates clear section breaks. Blockquote styling with left border and muted color. Pre/code blocks have distinct dark background. Table styling is clean with border-collapse. Typing hint uses `<kbd>` styling with border-bottom for tactile feel. Copy is plain-language and calm throughout — no gamification jargon.

**Visual density**
- Import stage: hero text + drop zone. Minimal chrome. Document stage: metadata bar + preview + sticky selection bar. Typing stage: compact stats row + progress bar + large passage + minimal controls. Results: centered, single-column, generous vertical rhythm. Mistake library: compact rows with clear separation. Density is appropriately low for a focused tool. The shadow on `.typing-shell` (`0 20px 60px rgba(57,55,45,.08)`) and `.document-preview` (`0 18px 55px rgba(57,55,45,.08)`) create appropriate elevation without heaviness.

---

### WARNING

**WARN-1: `--muted` text contrast marginally below WCAG AA**
`--muted: #5f6963` on `--paper: #f5f1e8` — computed contrast ratio is approximately 4.3:1. WCAG 2.1 AA requires 4.5:1 for normal text. This affects hero-support, body labels, file stats, hint text, toast messages, and error messages in the advisory bar. The brief states "The current palette passes" — this is incorrect for `--muted` body text. Impact is small (0.2:1 shortfall) but technically non-compliant.

**WARN-2: Inactive stage nav contrast well below WCAG AA**
Inactive stage steps use `#858b86` — approximately 2.6:1 against `--paper: #f5f1e8`. This is well below 4.5:1 for normal text and below 3:0 for large text (the nav text is `.74rem`). As non-informational navigation chrome, this may be acceptable under WCAG's "large text" exception if treated as decorative, but it should be documented as an intentional choice. Current steps use `--forest` which passes.

**WARN-3: Button min-height 43px — 1px short of WCAG 2.5.5**
`.button` has `min-height: 43px`. WCAG 2.5.5 (AAA) and common touch-target guidelines recommend 44x44px. The brief acknowledges this: "Current buttons are 43px min-height — close but technically 1px short." `.button-small` at 36px is further below the guideline. The `.icon-button` at 34px is above the absolute 24px minimum but below 44px.

**WARN-4: Typing passage minimum font-size on small viewports**
`clamp(1.18rem, 2.1vw, 1.55rem)` — at a 320px viewport, `2.1vw` = 6.72px ≈ 0.42rem, so the clamp resolves to the floor of `1.18rem` ≈ 18.9px. The brief recommends `1.35rem–1.45rem` minimum on mobile for better character discrimination. At 320px, users get ~19px instead of the recommended ~22px. The 620px breakpoint increases padding but doesn't increase the font-size floor.

**WARN-5: `.char` has `transition: color .08s, background .08s` — motion during typing**
The CSS at line 163: `.char { ... transition: color .08s, background .08s; }`. When a character changes state (correct, incorrect, current), the color and background animate over 80ms. The brief's motion principles state: "Character highlighting must be instant (no transition on `.char` state changes during active typing)." This creates a subtle flash/hold effect on each keystroke that is perceptible and violates the "zero perceptible lag" principle. Under `prefers-reduced-motion`, the global rule kills this, but for all other users it creates a slight drag on the keystroke-to-feedback loop. The `transition: width .2s ease` on the progress bar is acceptable (not per-character).

**WARN-6: `is-current` cursor uses three simultaneous visual signals**
The `.char.is-current` rule applies: `background: #d7e3d9` (tint), `box-shadow: inset 2px 0 0 var(--forest)` (left border bar), AND `animation: cursor-pulse 1.25s ease-in-out infinite` (pulsing background). Three signals competing simultaneously — background tint changes, a left-edge bar pulses, and the background color oscillates. For a "calm" interface, this is over-signaled. The brief's visual principles say "Color is secondary" to size/weight/spacing for hierarchy — here, color is doing all the work, repeatedly.

**WARN-7: `is-incorrect` state — heavier than brief describes**
The brief describes the incorrect state as "wavy underline + rust-pale background. This is excellent — clear but not harsh." The implementation uses `color: #872f22` (a darker, more saturated red than the palette's `--rust: #a04732`) + `background: var(--rust-pale)` + `text-decoration: underline wavy #872f22 1px`. Three signals on every incorrect character. The darker red increases contrast harshness. The wavy underline is clear but visually aggressive in a dense passage. Consider whether all three signals are needed simultaneously.

**WARN-8: Selection bar `has-selection` border-top glow not implemented**
The brief recommends: "Add a subtle top-border glow when text is selected (already has `has-selection` dot — extend to the border)." The current implementation only changes the dot color and adds a `box-shadow` ring around the dot (`.has-selection .selection-dot { background: var(--forest); box-shadow: 0 0 0 5px var(--sage-pale); }`). The selection bar's `border-top: 1px solid var(--line)` does not change when selection is active. The brief's recommendation is not implemented.

**WARN-9: Mistake item hover state not implemented**
The brief recommends: "Add subtle hover state on `.mistake-item` rows (background tint) to improve scanability." No hover rule exists for `.mistake-item` in the CSS. When scanning a long list of mistakes, rows are visually indistinguishable until the user reads them. A subtle `background: rgba(245,241,232,.5)` on hover would improve scanability without adding visual weight.

**WARN-10: Stage transition uses scroll, not crossfade**
The brief recommends: "Replace with a crossfade transition between stages using opacity + transform." The current implementation uses `window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })`. This is a scroll-to-top, not a crossfade. It works functionally but doesn't deliver the premium feel the brief describes. The `is-active` class is toggled but no opacity/transform transition is defined on `.stage-panel`.

---

### RECOMMENDATION

**R-1: Remove `.char` transition during typing (addresses WARN-5)**
Remove `transition: color .08s, background .08s` from `.char`. Character state changes should be instant — the keystroke handler already updates DOM synchronously in the same frame. This aligns with the "zero perceptible lag" principle and the brief's motion rules. The 80ms transition creates a perceptible lag that contradicts the design intent.

**R-2: Replace stage scroll with crossfade (addresses WARN-10, brief §5)**
Add a transition on `.stage-panel`: `opacity 0.25s ease, transform 0.25s ease`. When switching stages, fade out the outgoing panel (opacity 0, translateY 8px) and fade in the incoming panel. Remove the `scrollTo` call or keep it as a no-op fallback. This delivers the premium feel the brief describes at very low implementation cost.

**R-3: Increase `.button` min-height to 44px (addresses WARN-3)**
Change `.button { min-height: 43px; }` to `min-height: 44px;`. One pixel. This closes the WCAG 2.5.5 gap the brief already identified. Also consider increasing `.button-small` from 36px to 38px as a stepping stone.

**R-4: Reduce `is-current` cursor to a single signal (addresses WARN-6)**
Choose one primary signal for the current character cursor. Recommended: keep `box-shadow: inset 2px 0 0 var(--forest)` (the left-edge bar) and remove `background: #d7e3d9` and the `cursor-pulse` animation. The inset border is distinctive, calm, and doesn't compete with the character glyph. If animation is desired, make it a very subtle opacity pulse on the border alone, or remove it entirely for maximum calm. The brief says "calm" — a pulsing background tint is not calm.

**R-5: Darken `--muted` to meet WCAG AA (addresses WARN-1)**
Adjust `--muted` from `#5f6963` to approximately `#4f5953` or `#4e584f`. This would raise contrast against `--paper: #f5f1e8` to approximately 4.7:1, clearing the 4.5:1 threshold. Brief already recommends refining the palette — this is a refinement, not a replacement. Verify the new value against `--white: #fffdf8` (white backgrounds on cards/panels) — it should still feel like a muted secondary text color, not primary.

**R-6: Document or fix stage nav contrast (addresses WARN-2)**
Either: (a) darken inactive stage text to approximately `#6b726d` (~3.5:1 against paper, closer to AA), or (b) document the choice as intentional decorative chrome with a note in the accessibility section. If (a), also verify the step number circle border (`#aaa9a0`) passes — it likely doesn't against paper at ~2.9:1.

**R-7: Increase typing passage font-size floor on mobile (addresses WARN-4)**
Change `clamp(1.18rem, 2.1vw, 1.55rem)` to `clamp(1.35rem, 2.1vw, 1.55rem)`. This ensures a minimum of ~22px on 320px viewports, matching the brief's recommendation. The `2.1vw` rate and `1.55rem` ceiling remain unchanged — only the floor adjusts.

**R-8: Add `.mistake-item` hover state (addresses WARN-9)**
Add: `.mistake-item:hover { background: rgba(245, 241, 232, 0.5); }` or similar subtle tint. This improves scanability in long mistake lists without adding visual weight. Keep transition short (0.1s) and transform-free.

**R-9: Extend `has-selection` to selection bar border-top (addresses WARN-8)**
Add a rule: `.has-selection { border-top-color: var(--forest); }` on `.selection-bar`, or add a subtle glow: `box-shadow: inset 0 2px 0 var(--sage-pale)`. Brief recommends a "subtle top-border glow" — the inset shadow approach achieves this without changing the border structure.

**R-10: Review `is-incorrect` signal count (addresses WARN-7)**
Consider whether three simultaneous signals (color change, background tint, wavy underline) are all needed. Options: (a) keep all three — clear but heavy, (b) drop the background tint and keep color + underline — still clear, less visual noise, (c) use only the wavy underline with the existing rust color — minimal but may be too subtle in dense passages. The brief says "clear but not harsh" — current implementation leans toward harsh. Option (b) is the recommended middle ground.

**R-11: Reduce shadow intensity on `.typing-shell` (cosmetic, aligned with brief's "calm" principle)**
`--shadow: 0 22px 70px rgba(45, 48, 39, 0.1)` is a large, dramatic shadow. Consider introducing the brief's recommended `--shadow-soft: 0 4px 24px rgba(45,48,39,.06)` and applying it to `.typing-shell` and `.document-preview` instead. The current shadow creates significant perceived weight. A softer shadow would feel more in keeping with "quiet surfaces."

---

### Summary

| Category | Status |
|---|---|
| Hierarchy | PASS |
| Typography | PASS (with WARN-4 on mobile font floor) |
| Spacing | PASS |
| Contrast | WARN-1 (muted text), WARN-2 (stage nav) |
| Focus states | PASS |
| Interaction consistency | PASS |
| Responsive behavior | PASS |
| Accessibility | PASS (strong baseline, minor gaps documented) |
| Motion restraint | WARN-5 (.char transition), WARN-6 (cursor over-signaled) |
| Readability | PASS |
| Visual density | PASS |

The design direction is fundamentally sound and well-executed. The warnings are technical refinements, not structural problems. The recommendations are ordered by impact: R-1 and R-4 are the highest-signal changes (they directly affect the typing experience), followed by R-2 and R-5 (crossfade and contrast), then the remaining refinements.
