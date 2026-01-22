## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2024-10-24 - Keyboard Accessibility for Hover Overlays
**Learning:** Elements hidden with `opacity: 0` that appear on hover (like project overlays) trap keyboard users if they contain focusable elements. Tabbing into them leaves the user focusing on an invisible element.
**Action:** Always add `:focus-within` to the visibility selector (e.g., `.card:hover .overlay, .card:focus-within .overlay`) to ensure the container becomes visible when a user tabs into it.

## 2024-10-24 - Accessible Names for Icon Links
**Learning:** Icon-only links often rely on `title` attributes, which are not consistently announced by all screen readers or accessible to touch users.
**Action:** Always add explicit `aria-label` attributes to icon-only buttons and links, using the `title` text or a more descriptive string (e.g., "View Source Code" instead of just "View Source").
