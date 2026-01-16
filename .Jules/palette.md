## 2024-05-23 - Accessibility Improvements
**Learning:** Dark mode interfaces often suffer from poor default focus visibility. Standard browser focus rings (often blue/black) disappear against dark backgrounds (`#0a0a0f`).
**Action:** Always implement a high-contrast custom `:focus-visible` style using the design system's accent color (e.g., `outline: 2px solid var(--accent-primary)`) to ensure keyboard navigability without degrading the mouse user experience.
