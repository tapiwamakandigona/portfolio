## 2026-01-14 - Focus Visibility in Dark Themes
**Learning:** Default browser focus rings can be nearly invisible on dark backgrounds, failing WCAG contrast requirements for keyboard navigation.
**Action:** Always override `:focus-visible` with a high-contrast accent color (e.g., `outline: 2px solid var(--accent)`) in dark mode designs to ensuring navigation is perceptible.
