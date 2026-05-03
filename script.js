/* ═══════════════════════════════════════════════════════
   script.js — Portfolio interactions
   Canvas particles · Typewriter · Counters · Scroll reveals
   Filtering · Nav · Cursor glow · Card spotlight
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── Utils ───────────────────────────────────────────── */
const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ── Scroll progress ─────────────────────────────────── */
function initScrollProgress() {
  const bar = qs('#scrollProgress');
  if (!bar) return;
  const update = () => {
    const h = document.documentElement;
    const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
    bar.style.width = pct + '%';
  };
  window.addEventListener('scroll', update, { passive: true });
}

/* ── Nav scroll behaviour ────────────────────────────── */
function initNav() {
  const nav  = qs('#nav');
  const ham  = qs('#hamburger');
  const menu = qs('#navLinks');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (ham && menu) {
    ham.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      ham.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    qsa('a', menu).forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        menu.classList.remove('open');
        ham.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }
}

/* ── Custom cursor glow ──────────────────────────────── */
function initCursorGlow() {
  const glow = qs('#cursorGlow');
  if (!glow || window.matchMedia('(hover: none)').matches) {
    if (glow) glow.style.display = 'none';
    return;
  }

  let mx = -999, my = -999;
  let cx = -999, cy = -999;
  let raf;

  const lerp = (a, b, t) => a + (b - a) * t;

  const animate = () => {
    cx = lerp(cx, mx, 0.1);
    cy = lerp(cy, my, 0.1);
    glow.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    raf = requestAnimationFrame(animate);
  };

  window.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    glow.style.opacity = '0';
  });
  window.addEventListener('mouseenter', () => {
    glow.style.opacity = '1';
  });

  raf = requestAnimationFrame(animate);
}

/* ── Card spotlight ──────────────────────────────────── */
function initCardSpotlight() {
  qsa('.bento-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width)  * 100;
      const y = ((e.clientY - rect.top)  / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
}

/* ── Canvas particle field ───────────────────────────── */
function initCanvas() {
  const canvas = qs('#heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, animFrame;
  const COUNT = window.innerWidth < 600 ? 40 : 80;

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };

  const rand = (min, max) => Math.random() * (max - min) + min;

  class Particle {
    constructor() { this.reset(true); }
    reset(init) {
      this.x  = rand(0, W);
      this.y  = init ? rand(0, H) : H + 10;
      this.r  = rand(0.5, 2.2);
      this.vx = rand(-0.15, 0.15);
      this.vy = rand(-0.4, -0.1);
      this.a  = rand(0.1, 0.7);
      this.life = 1;
      this.decay = rand(0.001, 0.004);
    }
    update() {
      this.x   += this.vx;
      this.y   += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -10) this.reset(false);
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.life * this.a;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = '#818cf8';
      ctx.fill();
      ctx.restore();
    }
  }

  const init = () => {
    resize();
    particles = Array.from({ length: COUNT }, () => new Particle());
  };

  const tick = () => {
    ctx.clearRect(0, 0, W, H);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 120) * 0.12 * particles[i].life;
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    particles.forEach(p => { p.update(); p.draw(); });
    animFrame = requestAnimationFrame(tick);
  };

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!animFrame) tick();
    } else {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  });

  window.addEventListener('resize', () => {
    resize();
    particles.forEach(p => { p.x = rand(0, W); p.y = rand(0, H); });
  }, { passive: true });

  // Respect reduced motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  init();
  observer.observe(canvas);
}

/* ── Typewriter ──────────────────────────────────────── */
function initTypewriter() {
  const el = qs('#typewriter');
  if (!el) return;

  const roles = [
    'Full-Stack Developer',
    'Game Developer',
    'Open Source Builder',
    'UI Craftsman',
    'Cross-Platform Dev',
  ];

  let ri = 0, ci = 0, deleting = false;
  const SPEED_TYPE = 70, SPEED_DEL = 40, PAUSE = 1800, PAUSE_EMPTY = 400;

  const tick = () => {
    const word = roles[ri];
    if (deleting) {
      ci--;
      el.textContent = word.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        ri = (ri + 1) % roles.length;
        setTimeout(tick, PAUSE_EMPTY);
        return;
      }
      setTimeout(tick, SPEED_DEL);
    } else {
      ci++;
      el.textContent = word.slice(0, ci);
      if (ci === word.length) {
        deleting = true;
        setTimeout(tick, PAUSE);
        return;
      }
      setTimeout(tick, SPEED_TYPE);
    }
  };

  setTimeout(tick, 800);
}

/* ── Scroll reveal ───────────────────────────────────── */
function initReveal() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    qsa('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  qsa('.reveal').forEach((el, i) => {
    el.style.transitionDelay = `${(i % 6) * 60}ms`;
    obs.observe(el);
  });
}

/* ── Counter animation ───────────────────────────────── */
function initCounters() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const duration = 1400;
      const start = performance.now();

      const easeOut = t => 1 - Math.pow(1 - t, 3);

      const step = now => {
        const t = clamp((now - start) / duration, 0, 1);
        el.textContent = Math.round(easeOut(t) * target);
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = target;
      };

      requestAnimationFrame(step);
      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  qsa('[data-target]').forEach(el => obs.observe(el));
}

/* ── Project filtering ───────────────────────────────── */
function initFilters() {
  const btns  = qsa('.filter-btn');
  const cards = qsa('.bento-card');
  if (!btns.length) return;

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      cards.forEach((card, i) => {
        const match = filter === 'all' || card.dataset.category === filter;

        if (match) {
          card.classList.remove('hidden');
          // stagger reveal
          card.style.animationDelay = `${i * 40}ms`;
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ── Smooth anchor scrolling ─────────────────────────── */
function initSmoothScroll() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); e.preventDefault(); return; }
    const target = qs('#' + id);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

/* ── Active nav link highlight ───────────────────────── */
function initActiveNav() {
  const sections = qsa('section[id]');
  const links = qsa('.nav-link');
  if (!links.length) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = links.find(l => l.getAttribute('href') === '#' + entry.target.id);
        if (active) active.classList.add('active');
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(s => obs.observe(s));
}

/* ── Hero entrance stagger for hero-stack chips ──────── */
function initHeroStack() {
  const chips = qsa('.hero-stack span');
  chips.forEach((chip, i) => {
    chip.style.opacity = '0';
    chip.style.transform = 'translateY(12px)';
    chip.style.transition = `opacity 0.5s ${0.5 + i * 0.07}s ease, transform 0.5s ${0.5 + i * 0.07}s ease`;
    requestAnimationFrame(() => {
      chip.style.opacity = '1';
      chip.style.transform = 'translateY(0)';
    });
  });
}

/* ── Init all ────────────────────────────────────────── */
function init() {
  initScrollProgress();
  initNav();
  initCursorGlow();
  initCardSpotlight();
  initCanvas();
  initTypewriter();
  initReveal();
  initCounters();
  initFilters();
  initSmoothScroll();
  initActiveNav();
  initHeroStack();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
