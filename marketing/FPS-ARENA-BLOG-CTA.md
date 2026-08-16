# FPS Arena CTA blocks for the news.tapiwa.me Three.js / game-dev posts

**Why.** Same missed-funnel as Emberdelve: `news.tapiwa.me` has 5 technical posts a browser-
FPS-curious reader lands on, but none link **FPS Arena** — a *live, free, no-install*
Three.js FPS at `https://fps.tapiwa.me`. This is the strongest possible conversion: the
reader is literally reading how a browser FPS is built; a "play the one I built" link
converts far better than a cold ad, and needs zero install.

**Product (from fps.tapiwa.me schema):** "FPS Arena — a free 3D FPS in the browser,
Three.js zombie-survival shooter. Campaign, endless horde, OPS missions, global
leaderboards. No install, no login. Price: free."

**Blocker.** news.tapiwa.me is an Appwrite deploy (not this repo) → paste-ready blocks,
styled to the site palette: teal `#0c7a63`, cream `#faf6ec`, muted `#9a9285`, bg `#1f1b14`.

## Priority posts (highest fit first)
1. `/threejs-fps-hitscan-vs-projectile/` — literally about FPS shooting mechanics
2. `/threejs-webgpu-port/`
3. `/rollback-netcode-browser/`
4. `/web-worker-game-physics/`
5. `/object-pooling-js-games/`

---

## Option A — inline callout card (drop into post-body)

```html
<aside style="margin:2rem 0;padding:1.25rem 1.4rem;border:1px solid #0c7a63;
  border-radius:12px;background:#171310;">
  <div style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;
    color:#0c7a63;margin-bottom:.4rem;">See it running</div>
  <p style="margin:0 0 .8rem;color:#faf6ec;font-size:1.02rem;line-height:1.5;">
    I built a full browser FPS with exactly these techniques. <strong>FPS Arena</strong> —
    a Three.js zombie-survival shooter with a campaign, endless horde and global
    leaderboards. Runs in your browser, no install, no login.
  </p>
  <a href="https://fps.tapiwa.me"
    style="display:inline-block;padding:.6rem 1.1rem;border-radius:9px;background:#0c7a63;
    color:#faf6ec;text-decoration:none;font-weight:600;">Play FPS Arena free →</a>
</aside>
```

## Option B — one line for the existing `post-related` list

```html
<a href="https://fps.tapiwa.me">→ FPS Arena — my free browser FPS (Three.js, no install)</a>
```

## Honesty guardrail
Only claim features the live build actually has (campaign, endless horde, OPS missions,
leaderboards, per the site's own schema). Don't invent modes.
