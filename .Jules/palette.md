## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2024-05-24 - JS-CSS Focus Conflict Resolution
**Learning:** JS-driven hover effects (like tilt) can trap focus states if they reset styles inline on `mouseleave`. Inline styles override CSS pseudo-classes like `:focus-within`.
**Action:** When implementing JS interactions that modify styles also controlled by CSS state (hover/focus), always clear the inline style (`element.style.prop = ''`) on cleanup instead of setting a specific value. This yields control back to the CSS engine.
