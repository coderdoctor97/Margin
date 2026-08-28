# Margin — Visual Design Research

Mode: DEGRADED (public web research + MCP Browser tools; browser-use Python automation not available in this environment)

---

## 1. Calm Typing Interfaces

### TypeMochi (typemochi.com)
- **Pattern**: Soft, warm, cozy aesthetic. No timers, no stress messaging. Anti-gamification.
- **Useful for**: Reinforcing that Margin's "calm, focused" direction is validated by market trends.
- **Risk**: Too cute/soft could hurt readability for extended sessions.
- **Margin adaptation**: Keep the calm philosophy, but maintain professional readability — no mascots or playful elements.

### FennecType (fennectype.vercel.app)
- **Pattern**: Desert-minimalist. Keyboard hints shown as understated text ("PRESS ESC OR CTRL+SHIFT+P FOR SETTINGS SPOTLIGHT"). Ample whitespace, restrained sans-serif, subdued color.
- **Useful for**: How to surface keyboard shortcuts without visual clutter.
- **Risk**: Could feel too sparse for new users.
- **Margin adaptation**: Use subtle keyboard hints in overlays and help text, not permanently visible chrome.

### Monkeytype (monkeytype.com)
- **Pattern**: Minimalist dark-mode-first. Customizable themes. Distraction-free. Character-level feedback with color-coded correctness.
- **Useful for**: Character feedback colors, progress bar minimalism, stat presentation.
- **Risk**: Monkeytype's dark-mode default is very dark (#0d0d0d) — Margin's warm paper palette is more distinctive.
- **Margin adaptation**: Adopt the character feedback color logic (correct/incorrect/current), but keep warm palette.

### Keybr (keybr.com)
- **Pattern**: Label-driven, monospace-friendly layout. Sparse settings. Utilitarian data presentation. Settings as simple toggle labels.
- **Useful for**: Minimal settings UI, stat presentation density, keyboard-first navigation.
- **Risk**: Too utilitarian — could feel clinical.
- **Margin adaptation**: Keep the minimal-settings philosophy, but add warmth through Margin's existing color palette.

---

## 2. Premium Dark/Light UI

### Linear.app (linear.app)
- **Pattern**: Inter typography, tight spacing scale (4px base), minimal chrome, subtle motion, calm surfaces.
- **Useful for**: Spacing system, animation easing, surface elevation approach.
- **Risk**: Linear is a complex dashboard — patterns may not translate to a single-focus typing app.
- **Margin adaptation**: Adopt Linear's 4px spacing base and `cubic-bezier(0.2, 0.8, 0.2, 1)` easing for organic motion.

### Dark Mode Best Practices (Muzli, Orbix, SaaS Dark Mode guides)
- **Pattern**: Semantic design tokens (not hardcoded hex). Surface hierarchy via lighter surfaces (not shadows). WCAG 4.5:1 contrast. 79% of dark modes get it wrong.
- **Useful for**: How to build a dark mode correctly when Margin adds it later.
- **Risk**: Dark mode requires careful design — not a simple color inversion.
- **Margin adaptation**: Defer dark mode. When implemented, use semantic tokens and surface hierarchy.

---

## 3. Editorial Typography

### Industry Standards (Harvard, W3C, design systems research)
- **Pattern**: Serif for long-form reading (Georgia, Charter, Lora). Line height 1.5–1.8x. 45–75 characters per line (60–70 CPL sweet spot). Dark gray (#333) on off-white. Ragged-right (no justification).
- **Useful for**: Validating Margin's existing Georgia serif choice and 1.95 line-height.
- **Risk**: None — Margin already follows these principles.
- **Margin adaptation**: Preserve existing typography. Consider increasing minimum font size on mobile from 1.18rem to 1.35rem for better character discrimination.

---

## 4. Character-Level Feedback

### Observed Patterns (Monkeytype, TypeZen, FennecType)
- **Correct**: Green or accent color, subtle weight increase or background tint.
- **Incorrect**: Red/warm color, wavy underline, subtle background tint — NOT harsh red flash.
- **Current**: Cursor with pulse animation (1.25s), inset shadow.
- **Useful for**: Validating Margin's existing character feedback design.
- **Margin adaptation**: Current design is already aligned. Consider slowing cursor pulse to 1.6s for calmer feel.

---

## 5. Progress/Statistics UI

### Observed Patterns (Keybr, Monkeytype)
- **WPM**: Large, prominent number. Primary stat.
- **Accuracy**: Secondary stat, equal visual weight.
- **Progress**: Thin (2–4px) bar, color-shifting based on threshold.
- **Presentation**: Tabular-nums font, clean label-value pairs.
- **Useful for**: Validating Margin's 4-column stat grid and thin progress bar.
- **Margin adaptation**: Current implementation is aligned. Add `cubic-bezier(0.2, 0.8, 0.2, 1)` easing to progress bar for organic feel.

---

## 6. Focus Mode

### Observed Patterns (FennecType, TypeMochi)
- **Pattern**: Hide all chrome except text and cursor. Keyboard shortcuts for settings. "Zen mode" that strips everything.
- **Useful for**: Future focus mode feature.
- **Risk**: Too aggressive focus mode could confuse users who lose context.
- **Margin adaptation**: Implement as opt-in, keyboard-triggered. Show minimal hint of stage/position. Never hide the typing passage itself.

---

## 7. Dialog/Modal Polish

### Industry Standards (Radix UI, Headless UI, Material Design)
- **Pattern**: Fade + scale entrance. Backdrop blur. 200–300ms duration. `cubic-bezier(0.4, 0, 0.2, 1)` or `ease-out`. Focus trap inside. Esc to close. Staggered children animation optional.
- **Useful for**: Margin's existing `<dialog>` implementation.
- **Risk**: Complex animations can cause layout shifts.
- **Margin adaptation**: Current implementation uses `<dialog>` with `showModal()`. Add `transform: scale(0.98)` → `scale(1)` entrance. Already has backdrop blur. Keep duration ≤ 250ms.

---

## 8. Accessible Motion

### W3C / Industry Best Practices
- **Pattern**: `prefers-reduced-motion: reduce` sets all animation durations to `0.01ms`. Never convey information through animation alone. Provide non-animated state that works identically. Focus indicators must remain visible.
- **Useful for**: Margin already implements `prefers-reduced-motion` comprehensively.
- **Risk**: Future animations might forget to respect reduced motion.
- **Margin adaptation**: Codify in `FRONTEND_RULES.md` — already done. Add JS detection class toggle for dynamic behavior.

---

## 9. References Summary

| Source | URL | Category | Key Pattern | Relevance |
|--------|-----|----------|-------------|-----------|
| TypeMochi | https://typemochi.com/ | Calm typing | Soft warm palette, anti-gamification, cozy aesthetic | Validates calm direction |
| FennecType | https://fennectype.vercel.app/ | Focus UI | Desert-minimal, understated keyboard hints, zen mode | Keyboard hint patterns |
| Monkeytype | https://monkeytype.com/ | Typing interface | Minimalist dark-mode, character feedback, customizable themes | Character feedback validation |
| Keybr | https://www.keybr.com/ | Statistics UI | Label-driven layout, monospace-friendly, sparse settings | Stat presentation density |
| Linear.app | https://linear.app/ | Premium productivity | Inter typography, 4px spacing base, subtle motion, calm surfaces | Spacing system, easing |
| Monospace Design System | https://mds.monospace.studio/ | Design system | Friendly, Calm, Clear, Fast, Forgiving principles | Core design philosophy |
| Muzli Dark Mode Guide | https://muz.li/blog/dark-mode-design-systems/ | Dark mode | Semantic tokens, surface hierarchy, WCAG contrast | Future dark mode strategy |
| W3C Accessibility | https://www.w3.org/WAI/tips/designing/ | Accessibility | WCAG 2.1 AA, focus management, keyboard support | Accessibility foundation |
| Harvard Readability | https://accessibility.huit.harvard.edu/design-readability | Typography | Line height 1.5–1.8x, 60–70 CPL, dark gray on off-white | Typography validation |
| DesignMD Linear Tokens | https://designmd.cc/benchmarks/linear | Design tokens | Inter type scale, spacing tokens, responsive breakpoints | Token system reference |

---

## 10. Degraded Research Notice

This research was conducted in DEGRADED mode due to browser-use Python automation not being available in this environment. Research relied on:
- Public web search results
- WebFetch for static page content
- Existing knowledge of referenced sites

Screenshots were not captured (MCP Browser preview tools were not invoked as the sites did not require visual verification beyond text content).

For future phases, consider running actual browser-use automation for:
- Live visual screenshots of reference sites
- Dynamic interaction patterns (hover states, transitions)
- Responsive behavior at multiple viewport sizes

---

## 11. Margin UX Analysis (ui-ux-pro-max secondary skill)

This section provides practical UX recommendations for the Margin typing practice application, based on direct review of the current UI implementation (src/styles.css, index.html, src/main.js).

Each recommendation follows the format: CURRENT PROBLEM, RECOMMENDED UX, WHY IT FITS MARGIN, IMPLEMENTATION PRIORITY.

---

### 11.1 Import Stage — Visual Hierarchy

**CURRENT PROBLEM:**
The import stage uses a 2-column grid (`.import-composition`) that collapses to single column at 880px. On desktop, the left copy column and right upload panel compete for attention. The large brand title ("Margin" at clamp(5rem, 11vw, 9.2rem)) dominates the entire viewport, potentially overwhelming the upload action.

**RECOMMENDED UX:**
Maintain the 2-column layout but reduce the brand title's visual dominance on large screens. Consider capping the title at `clamp(4rem, 8vw, 7rem)` on desktop (>1200px) to give the upload panel more visual weight. The hero-line and upload panel should feel equally important — not subordinated to the wordmark.

**WHY IT FITS MARGIN:**
Margin's first action is importing a document. If the brand mark overwhelms the upload panel, users may hesitate or miss the primary action. Reducing the title size preserves the editorial serif personality while improving task completion.

**IMPLEMENTATION PRIORITY:** Medium — non-breaking, pure CSS adjustment to `--brand-title` clamp range.

---

### 11.2 Import Stage — Drop Zone Clarity

**CURRENT PROBLEM:**
The drop zone has `min-height: 410px` and uses a dashed border. The document glyph (66×78px) is charming but may not communicate "file upload" to all users. The "or" divider and "Choose a file" button are visually subtle.

**RECOMMENDED UX:**
Keep the document glyph — it's distinctive. Add a subtle `border-color` transition on drag-over (already present). Consider adding a subtle icon or text hint like "Accepts .txt, .md, .docx" inside the drop zone itself (currently only in `.drop-help` which is small and muted). On mobile, ensure the drop zone remains tappable with adequate padding.

**WHY IT FITS MARGIN:**
The drop zone is the first real interaction. Clarity reduces friction. The current design is already strong — minor refinement only.

**IMPLEMENTATION PRIORITY:** Low — cosmetic only.

---

### 11.3 Select Stage — Document Preview Readability

**CURRENT PROBLEM:**
The `.document-preview` uses `font: 400 1.04rem/1.82 var(--serif)` — slightly smaller than the typing passage. The max-height of `min(62vh, 720px)` with `overflow: auto` means users scroll within a scrollable container inside a scrollable page. This creates a nested-scroll UX that can be confusing.

**RECOMMENDED UX:**
Keep the preview font size at 1.04rem — it's appropriate for reading without making users want to type immediately. The nested scroll is acceptable for a preview pane. Consider adding a subtle top-fade gradient on the preview container to indicate scrollability. This is a common pattern (used by Linear, Notion, etc.) and helps users discover that more content exists below.

**WHY IT FITS MARGIN:**
The preview is for reading, not typing. The font size should remain slightly smaller to create a visual distinction between "read and select" and "type." The scroll-fade indicator is a low-cost usability improvement.

**IMPLEMENTATION PRIORITY:** Low — optional CSS-only enhancement.

---

### 11.4 Select Stage — Selection Feedback

**CURRENT PROBLEM:**
The `.selection-bar` is sticky at the bottom with a `.has-selection` state that changes the `.selection-dot` color and adds a `box-shadow`. The feedback is immediate and clear. However, the selection bar's `border-top` and `border-bottom` are always visible, even when no text is selected, creating visual noise.

**RECOMMENDED UX:**
Keep the selection bar structure. When no text is selected, reduce the border opacity to near-transparent (e.g., `border-color: rgba(216, 210, 198, 0.3)`). When text is selected, bring the borders to full opacity and add a subtle top-border glow (as suggested in the design brief). This makes the bar feel "dormant" when not in use and "active" when text is selected.

**WHY IT FITS MARGIN:**
Reduces visual noise during the "read" phase when users are scanning for a passage. The bar should recede until it has something to report.

**IMPLEMENTATION PRIORITY:** Medium — requires a `.has-selection` state toggle on the bar itself, already partially implemented.

---

### 11.5 Type Stage — Typing Focus

**CURRENT PROBLEM:**
The `.typing-shell` has `height: min(54vh, 560px)` with `overflow: hidden`. The `.typing-passage` scrolls within this shell. The `.session-overlay` covers the passage when idle/paused. This is good — the overlay provides a clear "start" affordance. However, the live stats bar (`.live-stats`) is always visible above the typing shell, even during active typing. This can be slightly distracting.

**RECOMMENDED UX:**
Keep the stats bar visible — it's useful for progress tracking. Consider reducing its opacity slightly during active typing (e.g., `opacity: 0.7`) and restoring full opacity when paused/completed. This creates a subtle "chrome recedes" effect without hiding information. The overlay already handles the "idle" state well.

**WHY IT FITS MARGIN:**
Margin's philosophy is "calm, focused." Reducing chrome prominence during active typing aligns with this. The stats remain accessible but less visually demanding.

**IMPLEMENTATION PRIORITY:** Medium — CSS opacity transition on `.live-stats` during state changes.

---

### 11.6 Type Stage — Character Feedback

**CURRENT PROBLEM:**
Character feedback is excellent: `.char.is-correct` uses forest color + weight increase, `.char.is-incorrect` uses rust color + wavy underline + rust-pale background, `.char.is-current` uses ink color + inset shadow + pulse animation. The `transition: color .08s, background .08s` on `.char` is subtle and fast. This is well-designed.

One minor issue: the `cursor-pulse` animation runs at 1.25s and uses `background: #c2d5c5` at 50% — a soft sage. The pulse is gentle but may feel slightly fast for a "calm" experience.

**RECOMMENDED UX:**
Slow the cursor pulse from 1.25s to 1.6s. Consider reducing the pulse intensity by using a slightly more transparent sage (e.g., `rgba(203, 218, 205, 0.6)` at 50% instead of solid `#c2d5c5`). This makes the cursor feel more like a gentle breathing indicator rather than an active blink.

**WHY IT FITS MARGIN:**
The cursor is the user's primary spatial reference during typing. A calmer pulse reduces subliminal urgency without reducing visibility.

**IMPLEMENTATION PRIORITY:** High — single CSS value change, validates design brief recommendation.

---

### 11.7 Type Stage — Progress Visualization

**CURRENT PROBLEM:**
The `.progress-track` is 2px tall with a forest fill. It has `transition: width .2s ease`. This is minimal and good. However, the progress bar doesn't communicate "how much more" — only "how much done." For long passages, users may want a sense of remaining distance.

**RECOMMENDED UX:**
Keep the 2px track. Consider adding a subtle "remaining" indicator — perhaps the unfilled portion of the track uses a slightly warmer tone (e.g., `var(--line)` instead of transparent). This creates a subtle "road ahead" visualization without adding clutter. The progress percentage in the stats bar already communicates exact completion.

**WHY IT FITS MARGIN:**
Subtle, low-cost enhancement. The unfilled track acts as a gentle horizon line — users can see both progress and remaining distance at a glance.

**IMPLEMENTATION PRIORITY:** Low — optional CSS enhancement.

---

### 11.8 Type Stage — Statistics Presentation

**CURRENT PROBLEM:**
The `.live-stats` grid uses 4 equal columns: Progress, Time, WPM, Accuracy. The layout is clean and uses `font-variant-numeric: tabular-nums`. However, on mobile (<620px), the grid collapses to 2 columns, which is good. On tablet (620px–880px), it remains 4 columns, which may feel cramped.

**RECOMMENDED UX:**
Keep the 4-column layout on desktop. Consider adding a 3-column intermediate breakpoint at ~720px for tablets in landscape mode. The stat labels (uppercase, small) and values (serif, large) create clear hierarchy. This is already well-designed.

**WHY IT FITS MARGIN:**
The stat presentation is already aligned with premium productivity patterns (Keybr's label-driven layout, Monkeytype's minimal stat bar). No major changes needed.

**IMPLEMENTATION PRIORITY:** Low — optional responsive refinement.

---

### 11.9 Type Stage — Results Panel

**CURRENT PROBLEM:**
The results panel uses `animation: rise .5s ease both` for entrance. The `.result-grid` is a 4-column layout with border separators. The "most missed words" section is a simple text line with bold words. This is clean but could feel abrupt — the results appear all at once with no staggered reveal.

**RECOMMENDED UX:**
Add staggered animation delays to the result grid items. Each stat tile (`result-grid div`) could animate in with a 60ms–80ms delay between them. The "most missed words" line should appear last (after the stats). This creates a cascade effect that feels premium and guides the eye from the primary metric (WPM) to the secondary (accuracy, time, errors) to the actionable insight (missed words).

**WHY IT FITS MARGIN:**
Staggered reveals are a proven premium UI pattern (used by Linear, Radix UI). They create a sense of craftsmanship without adding complexity. The cascade guides attention logically.

**IMPLEMENTATION PRIORITY:** Medium — requires adding `animation-delay` to each result grid child.

---

### 11.10 Mistake Library — Dialog Polish

**CURRENT PROBLEM:**
The `.library-dialog` uses `<dialog>` with `showModal()`. The backdrop has `backdrop-filter: blur(3px)`. The dialog has `box-shadow: 0 30px 100px rgba(12,22,17,.35)` — a strong shadow. The dialog entrance is instant (no animation). This is functional but lacks the premium feel of a faded+scaled entrance.

**RECOMMENDED UX:**
Add a subtle entrance animation: `opacity: 0; transform: scale(0.98)` → `opacity: 1; transform: scale(1)` with `transition: opacity 0.2s ease-out, transform 0.2s ease-out`. Apply this via a `.is-open` class added after `showModal()`. The backdrop blur is already present — keep it. Ensure `prefers-reduced-motion: reduce` disables the animation (already handled globally).

**WHY IT FITS MARGIN:**
The dialog is the most "modal" interaction in Margin. A subtle entrance makes it feel intentional and premium without being distracting. The 0.2s duration is fast enough to not feel slow.

**IMPLEMENTATION PRIORITY:** Medium — requires JS to add/remove `.is-open` class and CSS for the animation.

---

### 11.11 Mistake Library — Empty State

**CURRENT PROBLEM:**
The `.library-empty` state shows concentric rings (`.empty-rings`), a heading "No saved words yet," and a description. This is good — it's clear, friendly, and uses visual interest (the rings) to avoid a stark empty state. The rings use `box-shadow` for the concentric effect, which is elegant.

**RECOMMENDED UX:**
Keep the empty state as-is. It's well-designed. Consider adding a subtle animation to the rings (a slow rotation or pulse) to make the empty state feel alive rather than dead. This should respect `prefers-reduced-motion`.

**WHY IT FITS MARGIN:**
Empty states should feel inviting, not abandoned. A subtle animation on the rings creates warmth without distraction.

**IMPLEMENTATION PRIORITY:** Low — optional CSS animation.

---

### 11.12 Mistake Library — Item Scanability

**CURRENT PROBLEM:**
The `.mistake-item` grid layout has 6 columns: checkbox, word, context, count, date, remove button. On desktop, this is dense but readable. On tablet (880px breakpoint), it collapses to 3 columns with context spanning. The `mistake-context` uses `text-overflow: ellipsis` with `white-space: nowrap` — context is truncated.

**RECOMMENDED UX:**
Keep the current grid. Consider adding a subtle `background: rgba(245, 241, 232, 0.5)` hover state on `.mistake-item` to improve scanability when the list is long. The ellipsis truncation is acceptable — full context is available in the mistake detail. The remove button is subtle (`color: var(--muted)`) — consider making it slightly more visible on hover (`color: var(--rust)`).

**WHY IT FITS MARGIN:**
The mistake library is a review tool, not a primary action surface. Subtle hover states improve usability without adding visual noise.

**IMPLEMENTATION PRIORITY:** Low — CSS-only enhancement.

---

### 11.13 Confirmation Dialog — Visual Weight

**CURRENT PROBLEM:**
The `.confirm-dialog` is 440px max-width with a white background and `box-shadow: var(--shadow)`. It's clean and functional. However, it uses the same shadow as `.parse-status` — no differentiation in visual weight. The "Continue" button uses `.button-danger` (rust) which is appropriate for destructive actions, but for non-destructive confirmations (like "Restart"), it feels slightly aggressive.

**RECOMMENDED UX:**
Keep the dialog structure. Consider adding a subtle scale entrance animation (see 11.10). For the confirm button: use `.button-primary` (forest) for non-destructive actions and `.button-danger` (rust) for destructive actions (like "Clear history"). Currently, `confirmAccept` always uses `.button-danger` — this is correct for "End session" but too aggressive for "Restart" or "Clear document."

**WHY IT FITS MARGIN:**
Visual weight should match action severity. A rust "Continue" button for a non-destructive action creates unnecessary alarm.

**IMPLEMENTATION PRIORITY:** Medium — requires JS to toggle button class based on action type.

---

### 11.14 Empty States — Import Stage

**CURRENT PROBLEM:**
The import stage has no explicit empty state — it's the default landing state. The privacy note ("Private by design. Documents are parsed in this browser...") is present below the drop zone. This is good — it establishes trust immediately.

**RECOMMENDED UX:**
Keep the privacy note. Consider adding a subtle animated indicator (like the import stage's `.motion-rise` animation on the copy and upload panel) to make the landing feel alive rather than static. The current `motion-rise` animation on `.import-copy` and `.upload-panel` already does this — keep it.

**WHY IT FITS MARGIN:**
Trust and calm are established from the first moment. The privacy note is a key differentiator for Margin.

**IMPLEMENTATION PRIORITY:** N/A — already implemented well.

---

### 11.15 Responsive Behavior — Mobile Typing

**CURRENT PROBLEM:**
On mobile (<620px), the `.typing-passage` padding reduces from `clamp(2rem, 7vw, 5.5rem)` to `2rem 1.25rem`. The `.typing-shell` min-height drops to 330px. The `.live-stats` grid becomes 2 columns. The `.session-controls` wraps. This is well-adapted.

One concern: the `.typing-passage` font size on mobile is `clamp(1.18rem, 2.1vw, 1.55rem)`. At 320px viewport width, `2.1vw` = 6.72px ≈ 0.42rem, so the clamp resolves to 1.18rem (18.88px). This is readable but tight for character discrimination during fast typing.

**RECOMMENDED UX:**
Increase the minimum font size from 1.18rem to 1.35rem (21.6px) on mobile. Change the clamp to `clamp(1.35rem, 2.5vw, 1.55rem)`. This provides better character discrimination without making the text feel oversized. The line-height of 1.95 remains comfortable.

**WHY IT FITS MARGIN:**
Mobile typing is common. Slightly larger text reduces errors and eye strain during extended mobile sessions. The change is small but meaningful.

**IMPLEMENTATION PRIORITY:** High — single CSS value change, validates design brief recommendation.

---

### 11.16 Keyboard Accessibility — Stage Transitions

**CURRENT PROBLEM:**
The skip link is present and functional. The drop zone responds to Enter/Space. All buttons are real `<button>` elements. Dialogs use `<dialog>` with `showModal()` (includes built-in focus trap). The typing passage has `tabindex="0"` and `role="textbox"`. Keyboard accessibility is already strong.

One gap: when the stage transitions from Import → Select → Type, focus is not explicitly managed. The user must click or tab to the new interactive area. The `showStage()` function hides/shows panels but doesn't move focus.

**RECOMMENDED UX:**
Add focus management to `showStage()`. When transitioning to the Select stage, focus the document preview (`.document-preview`). When transitioning to the Type stage, focus the typing passage (`.typing-passage`). When returning to Import, focus the drop zone (`.dropZone`). This ensures keyboard users land on the primary interactive element of each stage.

**WHY IT FITS MARGIN:**
Focus management is a WCAG 2.1 AA requirement for dynamic content. Margin already has strong keyboard accessibility — this is a logical extension.

**IMPLEMENTATION PRIORITY:** Medium — requires adding 3 `focus()` calls in `showStage()`.

---

### 11.17 Visual Hierarchy — Stage Indicators

**CURRENT PROBLEM:**
The `.stage-nav` shows step indicators (1 Import, 2 Read, 3 Type) in the header. On desktop, all three steps are visible. On mobile (≤880px), only the current step is shown. This is clean and appropriate.

The stage steps use numbered circles with border transitions. The `.is-current` state uses forest fill. The `.is-done` state uses sage-pale fill. This hierarchy is clear.

**RECOMMENDED UX:**
Keep the current stage indicators. Consider adding a subtle `transition: all 0.2s ease` to `.stage-step` for smoother state changes. Currently, the state changes are instant (class toggle in JS). A subtle transition would make the stage progression feel more polished.

**WHY IT FITS MARGIN:**
Stage indicators provide orientation. Smooth transitions between states create a premium feel without distracting from the primary task.

**IMPLEMENTATION PRIORITY:** Low — CSS-only enhancement.

---

### 11.18 Loading States — Parse Status

**CURRENT PROBLEM:**
The `.parse-status` component shows a spinner (`.status-spinner`), a title, and a message. The spinner uses `border-top-color: var(--forest)` with `animation: spin .8s linear infinite`. The success state shows a checkmark (CSS clip-path). The error state shows an exclamation mark. This is well-designed.

**RECOMMENDED UX:**
Keep the current loading states. They're clear, branded (forest color), and provide appropriate feedback for success/error. The `.is-success` and `.is-error` states use distinct background colors (`#f7fbf7` and `#fff8f5`) — this is good.

**WHY IT FITS MARGIN:**
Loading states should be calm and informative. The current implementation achieves this without visual noise.

**IMPLEMENTATION PRIORITY:** N/A — already implemented well.

---

### 11.19 Toast Notifications

**CURRENT PROBLEM:**
The `.toast` is fixed at the bottom center with `animation: toast-in .2s ease both`. It uses `background: var(--ink)` (near-black) with white text. The toast is concise and unobtrusive. The `aria-live="polite"` region ensures screen readers announce it.

**RECOMMENDED UX:**
Keep the toast as-is. Consider adding a subtle exit animation (fade out + slight slide down) when the toast disappears. Currently, it just sets `hidden` after 3.8s — no exit animation. A 200ms fade-out would feel more polished.

**WHY IT FITS MARGIN:**
Toasts should be noticeable but not disruptive. An exit animation provides closure without being flashy.

**IMPLEMENTATION PRIORITY:** Low — requires JS to trigger exit animation before hiding.

---

### 11.20 Keyboard Focus States

**CURRENT PROBLEM:**
The global focus style is `outline: 3px solid #bd7a3a` with `outline-offset: 3px`. This is a warm gold/orange outline — distinctive and high-contrast against the paper background. It passes WCAG 2.1 AA (3:1 contrast against `#f5f1e8`).

One concern: the gold outline (`#bd7a3a`) is not part of the design token system. It's a hardcoded value. If the palette ever changes (e.g., dark mode), this outline color may not remain visible.

**RECOMMENDED UX:**
Keep the 3px outline with 3px offset — this is excellent for accessibility. Consider adding `--focus-ring: #bd7a3a` to the theme tokens in `:root` for consistency. When dark mode is added later, the focus ring color can be adjusted via the token.

**WHY IT FITS MARGIN:**
Focus indicators are non-negotiable for accessibility. The current outline is strong. Tokenizing it ensures it remains visible across theme changes.

**IMPLEMENTATION PRIORITY:** Low — CSS token addition.

---

## 12. UX Recommendations Summary

| Area | Current Strength | Recommended Improvement | Priority |
|------|-----------------|------------------------|----------|
| Import — Visual Hierarchy | Strong editorial serif | Cap brand title on large screens | Medium |
| Import — Drop Zone | Charming glyph, clear CTA | Minor text hint refinement | Low |
| Select — Preview Readability | Good serif, comfortable size | Optional scroll-fade indicator | Low |
| Select — Selection Feedback | Immediate, clear | Dormant/active border states | Medium |
| Type — Typing Focus | Overlay + stats bar | Subtle stats opacity during typing | Medium |
| Type — Character Feedback | Excellent correct/incorrect/current | Slow cursor pulse to 1.6s, reduce intensity | High |
| Type — Progress | Minimal 2px track | Optional unfilled track color | Low |
| Type — Statistics | Clean 4-column grid | Optional 3-col tablet breakpoint | Low |
| Type — Results | Clean rise animation | Staggered stat tile cascade | Medium |
| Mistake Library — Dialog | Strong shadow, backdrop blur | Scale entrance animation | Medium |
| Mistake Library — Empty State | Charming rings, clear copy | Optional subtle ring animation | Low |
| Mistake Library — Items | Dense but readable | Hover background tint | Low |
| Confirmation Dialog | Clean, functional | Button class by action severity | Medium |
| Empty States — Import | Privacy note establishes trust | Already strong | N/A |
| Responsive — Mobile Typing | Good adaptation | Increase min font to 1.35rem | High |
| Keyboard — Stage Transitions | Strong overall | Add focus management per stage | Medium |
| Stage Indicators | Clear numbering, states | Optional transition on state change | Low |
| Loading States | Branded, clear | Already strong | N/A |
| Toast Notifications | Clean, accessible | Optional exit animation | Low |
| Focus States | Strong gold outline | Tokenize for theme consistency | Low |

---

## 13. Skill Attribution

This analysis was produced using the **ui-ux-pro-max** skill as a secondary design-analysis pass over the Margin project. All findings are based on direct review of:
- `src/styles.css` (274 lines, @layer architecture)
- `index.html` (212 lines, semantic structure)
- `src/main.js` (820 lines, event wiring and state management)
- `.agent/DESIGN_BRIEF.md` (235 lines, design direction)
- `.agent/FRONTEND_RULES.md` (80 lines, engineering constraints)
- `.agent/ACTIVE_RULES.md` (29 lines, active constraints)

No application source code was modified. No UI frameworks were installed. No animation libraries were added.
