# Emberdelve CTA blocks for the news.tapiwa.me "provably-fair" posts

**Why.** `news.tapiwa.me` pulls the real organic traffic (~300 clicks / 28 days, Search
Console) and its top posts are all about *provably-fair* gaming (dice, mines, plinko,
crash, RNG certification). That reader is the *exact* audience for Emberdelve, whose whole
pitch is **"provably fair — every death is fair, deterministic, no hidden math."** Yet none
of those posts link the game. This wires existing free traffic → installs.

**Blocker.** news.tapiwa.me is an Appwrite deploy, not this repo — so these are paste-ready
blocks for whoever edits that site (owner), styled to match its palette:
teal `#0c7a63`, cream text `#faf6ec`, muted `#9a9285`, dark bg `#1f1b14`.

Best placements: (1) inside `post-body` after the "how to verify fairness" section, and/or
(2) add a line to the existing `post-related` list (the pattern already links ZimBet).

---

## Option A — inline callout card (drop into post-body)

```html
<aside style="margin:2rem 0;padding:1.25rem 1.4rem;border:1px solid #0c7a63;
  border-radius:12px;background:#171310;">
  <div style="font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;
    color:#0c7a63;margin-bottom:.4rem;">Built by the author</div>
  <p style="margin:0 0 .8rem;color:#faf6ec;font-size:1.02rem;line-height:1.5;">
    I put this "provably fair" idea into a real game. <strong>Emberdelve</strong> is a
    dice roguelite where every run is seeded and every death is explainable — no hidden
    modifiers, no rigged near-misses. Same seed, same outcome, every time.
  </p>
  <a href="https://play.google.com/store/apps/details?id=com.tsorostudios.emberdelve"
    style="display:inline-block;padding:.6rem 1.1rem;border-radius:9px;background:#0c7a63;
    color:#faf6ec;text-decoration:none;font-weight:600;">Play it free on Google Play →</a>
</aside>
```

## Option B — one line for the existing `post-related` list

```html
<a href="https://play.google.com/store/apps/details?id=com.tsorostudios.emberdelve">
  → Emberdelve — a provably-fair dice roguelite (Android, free)</a>
```

## Option C — plain text (for any Markdown-sourced posts)

```markdown
> **Built by the author:** I turned this provably-fair idea into a real game —
> [Emberdelve](https://play.google.com/store/apps/details?id=com.tsorostudios.emberdelve),
> a dice roguelite where every run is seeded and every death is explainable. Free on Google Play.
```

## Priority posts to add it to (highest thematic fit first)
1. `/provably-fair-dice-mines/` — dice, closest match
2. `/provably-fair-vs-rng-certification/`
3. `/plinko-provably-fair/`
4. `/provably-fair-crash-aviator/`
5. `/how-online-slots-work-rng/`

## Honesty guardrail
Emberdelve is "fair by determinism/seeding", NOT a cryptographic commit-reveal
"provably-fair" system like a casino. Keep the wording "provably fair *idea*" / "fair by
design" — don't claim cryptographic provable fairness it doesn't implement.
