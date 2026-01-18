## 2024-05-23 - Semantic Buttons for Interactions
**Learning:** Interactive elements like menu toggles are often implemented as `div`s with click handlers, which fail to provide native keyboard accessibility (focus, Enter/Space support) and semantic meaning to screen readers.
**Action:** Always use `<button>` elements for actions. If a custom design is needed, use CSS to reset button styles (`background: none`, `border: none`) while preserving the semantic value and focusability. Ensure `aria-expanded` and `aria-controls` are used for toggle interactions.

## 2024-05-24 - Navigation Bypass Blocks
**Learning:** Static sites often miss the "Skip to Content" mechanism, forcing keyboard users to tab through global navigation on every page load. Missing semantic `<main>` landmarks also hinders landmark navigation.
**Action:** Wrap the primary content in a `<main id="main-content">` tag and add a hidden-until-focused "Skip to content" link as the first body element.
