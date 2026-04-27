# tapiwa.me — Personal Portfolio

Personal portfolio site, live at **[tapiwa.me](https://tapiwa.me)**.

Deployed automatically via [Appwrite Sites](https://appwrite.io/products/sites) — every push to `main` triggers a new build.

## Stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build step
- Dark/light theme with CSS custom properties
- Scroll-reveal animations with `IntersectionObserver`
- Project filter bar, animated stat counters, skill bars

## Structure

```
index.html   — Hero, About, Projects, Skills, Contact sections
styles.css   — Design tokens, layout, animations
script.js    — Theme toggle, mobile nav, observers, filters
```

## Local Development

Just open `index.html` in a browser — no build step required.

```bash
# Quick local server (Python)
python3 -m http.server 3000
# Then open http://localhost:3000
```

## Deployment

Pushing to the `main` branch triggers an automatic Appwrite deployment to tapiwa.me.
