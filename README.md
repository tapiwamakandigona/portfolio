# tapiwa.me — Personal Portfolio

Personal portfolio site, live at **[tapiwa.me](https://tapiwa.me)**.

Deployed automatically via [Appwrite Sites](https://appwrite.io/products/sites) — every push to `main` triggers a new build.

## Stack

- Vanilla HTML, CSS, JavaScript — no frameworks, no build step
- Dark/light theme support with CSS custom properties
- Scroll-reveal animations with `IntersectionObserver`
- Fonts: Inter (body), JetBrains Mono (code/labels)
- SEO: Open Graph, Twitter Cards, JSON-LD structured data, sitemap

## Structure

```
index.html              — Main portfolio: hero, work, recognition, about
styles.css              — Design tokens, layout, animations, blog styles
script.js               — Theme toggle, back-to-top, keyboard shortcuts
404.html                — Branded not-found page (noindex)
robots.txt              — Crawler directives + sitemap reference
sitemap.xml             — URL list for search engines
og-image.png            — Open Graph / social share image (1200×630)

blog/
  index.html            — Blog index with all posts
  building-a-ride-hailing-app/
  3d-fps-game-in-the-browser/
  provably-fair-casino-games/
  send-files-without-internet/
  banking-app-with-supabase/
  zero-dependency-react-component-library/

lanlink/                — LanLink project page + downloads subpage
tapride/                — TapRide project page
fps-game/               — Browser FPS project page
zimbet/                 — ZimBet project page
zimpay/                 — ZimPay project page

about/                  — Redirect → /
contact/                — Redirect → /
home/                   — Redirect → /
projects/               — Redirect → /#work

.github/
  workflows/deploy.yml  — Appwrite Sites auto-deploy on push to main
  dependabot.yml        — Keeps GitHub Actions up to date
```

## Local Development

Just open `index.html` in a browser — no build step required.

```bash
# Quick local server (Python)
python3 -m http.server 3000
# Then open http://localhost:3000
```

### Keyboard Shortcuts

| Key | Action                   |
|-----|--------------------------|
| `G` | Open GitHub profile      |
| `E` | Copy email to clipboard  |

## Deployment

Pushing to the `main` branch triggers an automatic Appwrite deployment to tapiwa.me. The workflow (`.github/workflows/deploy.yml`) packages the repo as a tarball and deploys via the Appwrite API.

## License

[MIT](LICENSE)
