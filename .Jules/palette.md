## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2026-01-20 - Hidden Focusable Content
**Learning:** Containers with `opacity: 0` (often used for hover effects) can still contain focusable elements that are invisible to keyboard users when focused, causing confusion.
**Action:** Use `:focus-within` on the container to ensure it becomes visible (`opacity: 1`) when any element inside it receives focus, mirroring the hover behavior for keyboard users.
