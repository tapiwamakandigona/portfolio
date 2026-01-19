## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2024-05-24 - Icon-Only Link Accessibility
**Learning:** Icon-only links (common in project cards and social footers) rely on visual context that screen readers miss. `title` attributes are often insufficient or inconsistent across assistive technologies.
**Action:** Always add descriptive `aria-label` attributes to icon-only links (e.g., `aria-label="View Source Code for Project X"`) and ensure they have visible focus states (e.g., `outline`) for keyboard navigation.
