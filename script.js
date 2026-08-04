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

// ── Theme toggle ──────────────────────────────────────────
(function () {
  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const apply = t => {
    root.setAttribute('data-theme', t);
    if (meta) meta.setAttribute('content', t === 'dark' ? '#14120d' : '#faf6ec');
  };
  apply(root.getAttribute('data-theme') || 'light');
  let toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    const nav = document.querySelector('.site-header nav');
    if (nav) {
      toggle = document.createElement('button');
      toggle.className = 'theme-toggle';
      toggle.id = 'theme-toggle';
      toggle.setAttribute('aria-label', 'Toggle dark mode');
      toggle.title = 'Toggle dark mode';
      toggle.innerHTML = '<span class="theme-icon" aria-hidden="true"></span>';
      nav.appendChild(toggle);
    }
  }
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('theme', next); } catch (e) {}
      apply(next);
    });
  }
})();

// ── Scroll reveal ─────────────────────────────────────────
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const els = document.querySelectorAll('.work-item, .award-item, .oss-grid li, .blog-entry, .about-text p, .stack-row, .more-projects, .all-repos-link');
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  els.forEach(el => { el.classList.add('reveal'); io.observe(el); });
})();
