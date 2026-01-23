## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2024-05-24 - Focus Visibility for Hover Overlays
**Learning:** Interactive elements inside `opacity: 0` hover overlays are invisible to keyboard users when focused, failing WCAG Focus Visible criteria.
**Action:** Always pair `.container:hover .overlay { opacity: 1 }` with `.container:focus-within .overlay { opacity: 1 }` to ensure the overlay appears when a user tabs into it.
