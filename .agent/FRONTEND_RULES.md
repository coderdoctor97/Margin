# Margin Frontend Rules

## 1. Core Engineering Rules
- Vanilla JS only unless explicitly approved
- Do not introduce a framework unless explicitly approved
- Prefer small modules over large monolithic files
- Do not use inline event handlers
- Keep DOM updates intentional and minimal
- Avoid unnecessary re-renders or repeated DOM queries
- Cache DOM references when reused

## 2. Accessibility Rules
- Preserve skip links
- Preserve aria-live regions
- Maintain keyboard navigability
- All dialogs must be accessible
- Focus must be managed during stage transitions
- Respect prefers-reduced-motion
- Do not remove semantic HTML

## 3. Security Rules
- Continue using DOMPurify for all imported document HTML
- Preserve strict sanitizer policy
- Do not allow unsafe protocols
- Do not store document content unless explicitly requested
- Do not weaken paste blocking during typing sessions

## 4. CSS Rules
- Use existing CSS layers carefully
- Do not create utility-class chaos
- Avoid duplicate styles
- Maintain dark/light theme consistency if present
- Prefer CSS variables for theme tokens
- Keep animation performance on transform/opacity only

## 5. Performance Rules
- Avoid layout thrashing
- Avoid animating width, height, top, left, margin, padding
- Use transform and opacity for animations
- Debounce or throttle expensive input handlers if needed
- Avoid expensive DOM measurements during typing
- Keep typing input latency as low as possible

## 6. Testing Rules
- Preserve Vitest coverage
- Add tests when changing behavior
- Do not break existing typing-session tests
- Do not break sanitizer tests
- Do not break mistake-store schema tests

## 7. Premium UI Rules
- Do not make the UI flashy at the cost of typing performance
- Prefer calm, focused, premium design
- Animations must be subtle and fast
- Micro-interactions must not interrupt typing flow
- All premium effects must respect reduced motion
- Visual polish must not reduce readability

## 8. Refactoring Rules
- Do not refactor src/main.js unless explicitly approved
- If refactoring is approved, split by concern:
  - session wiring
  - mistake library UI
  - stage transitions
  - stats rendering
- Preserve public behavior exactly
- Refactor only with passing tests

## 9. Tailwind CDN Rule
- The Tailwind CDN in index.html is currently unused/dead weight
- Do not remove it yet
- Do not start using Tailwind classes yet
- Decide later whether to remove it or properly adopt Tailwind

## 10. Approval Rules
- Do not modify source code without explicit approval
- Do not install new dependencies without explicit approval
- Do not change visual design without explicit approval
- Do not change security policy without explicit approval
