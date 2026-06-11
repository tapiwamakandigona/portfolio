// ── Page fade-in ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  requestAnimationFrame(() => document.body.classList.add('ready'));
});

// ── Auto year ─────────────────────────────────────────────
const yr = document.getElementById('yr');
if (yr) yr.textContent = new Date().getFullYear();

// ── Copy email on click ───────────────────────────────────
const EMAIL = 'silentics.org@gmail.com';
function makeEmailCopy(el) {
  el.addEventListener('click', e => {
    if (!navigator.clipboard) return;
    e.preventDefault();
    navigator.clipboard.writeText(EMAIL).then(() => {
      const orig = el.textContent;
      el.textContent = 'Copied ✓';
      setTimeout(() => { el.textContent = orig; }, 1800);
    }).catch(() => { window.location.href = 'mailto:' + EMAIL; });
  });
}

const emailLink = document.getElementById('email-link');
if (emailLink) makeEmailCopy(emailLink);

document.querySelectorAll('a[href="mailto:' + EMAIL + '"]').forEach(el => {
  if (el !== emailLink) makeEmailCopy(el);
});

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
    navigator.clipboard && navigator.clipboard.writeText(EMAIL).then(() => {
      if (emailLink) {
        const orig = emailLink.textContent;
        emailLink.textContent = 'Copied ✓';
        setTimeout(() => { emailLink.textContent = orig; }, 1800);
      }
    });
  }
});
