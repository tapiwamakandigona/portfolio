// Minimal interactions only. No bloat.

// ── Fade-in on load (CSS-handled mostly, this just unblocks) ──
document.documentElement.classList.add('js');

// ── Copy email on click (optional) ──
document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
  el.addEventListener('click', e => {
    const email = el.href.replace('mailto:', '');
    if (navigator.clipboard) {
      e.preventDefault();
      navigator.clipboard.writeText(email).then(() => {
        const orig = el.textContent;
        el.textContent = 'Copied ✓';
        setTimeout(() => { el.textContent = orig; }, 1800);
      }).catch(() => { /* fallback: open mail client */ window.location.href = el.href; });
    }
  });
});
