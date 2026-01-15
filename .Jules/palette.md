## 2024-05-22 - Icon-Only Buttons & Focus States
**Learning:** Icon-only interactive elements must have descriptive `aria-label` attributes as they are otherwise invisible to screen readers. Additionally, on dark backgrounds, default browser focus rings are often invisible; custom high-contrast outlines are essential for keyboard navigation.
**Action:** Always verify icon-only buttons have labels and test keyboard focus visibility on dark themes, adding `outline: 2px solid var(--accent-primary)` if needed.
