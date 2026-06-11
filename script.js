// ── Page fade-in ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('ready'));
});

// ── Auto year ─────────────────────────────────────────────
const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

// ── Back to top ───────────────────────────────────────────
const btn = document.getElementById('back-top');
if (btn) {
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Keyboard shortcuts ────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
  if (e.key === 'g' || e.key === 'G') {
    window.open('https://github.com/tapiwamakandigona', '_blank', 'noopener');
  }
  if (e.key === 'e' || e.key === 'E') {
    const EMAIL = 'silentics.org@gmail.com';
    const emailLink = document.querySelector('a[href^="mailto:"]');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(EMAIL).then(() => {
        if (emailLink) {
          const orig = emailLink.textContent;
          emailLink.textContent = 'Copied ✓';
          setTimeout(() => { emailLink.textContent = orig; }, 1800);
        }
      }).catch(() => {});
    }
  }
});
