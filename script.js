/**
 * tapiwa.me — Portfolio Scripts
 * Author  : Tapiwa Makandigona
 * Updated : 2026-04-27
 *
 * Features:
 *   - Dark / Light theme toggle with localStorage persistence
 *   - Mobile hamburger menu
 *   - Reveal-on-scroll using IntersectionObserver
 *   - Project filter bar (client-side)
 *   - Animated stat counters
 *   - Skill bar animations
 *   - Nav shrink on scroll
 */

(function () {
  'use strict';

  /* ── Theme ─────────────────────────────────────────── */
  const html = document.documentElement;
  const themeKey = 'tm-theme';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem(themeKey, theme);
  }

  // Initialise theme before paint (runs synchronously)
  const savedTheme = localStorage.getItem(themeKey);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

  document.addEventListener('DOMContentLoaded', function () {
    /* ── DOM refs ───────────────────────────────────── */
    const themeToggle = document.getElementById('themeToggle');
    const hamburger   = document.getElementById('hamburger');
    const navLinks    = document.getElementById('navLinks');
    const nav         = document.getElementById('nav');
    const filterBtns  = document.querySelectorAll('.filter-btn');
    const cards       = document.querySelectorAll('#projectsGrid .card');
    const revealEls   = document.querySelectorAll('.reveal');
    const statNumbers = document.querySelectorAll('.stat-number');
    const skillBars   = document.querySelectorAll('.skill-bar');

    /* ── Theme toggle ───────────────────────────────── */
    if (themeToggle) {
      themeToggle.addEventListener('click', function () {
        const current = html.getAttribute('data-theme');
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }

    /* ── Hamburger menu ─────────────────────────────── */
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function () {
        const isOpen = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });

      // Close on nav link click
      navLinks.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* ── Nav shrink on scroll ───────────────────────── */
    if (nav) {
      window.addEventListener('scroll', function () {
        nav.style.borderBottomColor = window.scrollY > 20 
          ? 'var(--border)' 
          : 'transparent';
      }, { passive: true });
    }

    /* ── Reveal on scroll ───────────────────────────── */
    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );

      revealEls.forEach(function (el) {
        revealObserver.observe(el);
      });
    } else {
      // Fallback: make all visible immediately
      revealEls.forEach(function (el) {
        el.classList.add('visible');
      });
    }

    /* ── Animated stat counters ─────────────────────── */
    let statsAnimated = false;

    function animateCounter(el) {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const duration = 1200;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }

      requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window && statNumbers.length) {
      const statsSection = document.getElementById('about');
      if (statsSection) {
        const statsObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting && !statsAnimated) {
                statsAnimated = true;
                statNumbers.forEach(animateCounter);
                statsObserver.disconnect();
              }
            });
          },
          { threshold: 0.4 }
        );
        statsObserver.observe(statsSection);
      }
    }

    /* ── Skill bar animations ───────────────────────── */
    if ('IntersectionObserver' in window && skillBars.length) {
      const barObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
              barObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.3 }
      );

      skillBars.forEach(function (bar) {
        barObserver.observe(bar);
      });
    } else {
      skillBars.forEach(function (bar) {
        bar.classList.add('animated');
      });
    }

    /* ── Project filter ─────────────────────────────── */
    if (filterBtns.length && cards.length) {
      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          const filter = btn.getAttribute('data-filter');

          // Update active button
          filterBtns.forEach(function (b) { b.classList.remove('active'); });
          btn.classList.add('active');

          // Show/hide cards
          cards.forEach(function (card) {
            const category = card.getAttribute('data-category');
            const match = filter === 'all' || category === filter;

            if (match) {
              card.classList.remove('hidden');
            } else {
              card.classList.add('hidden');
            }
          });
        });
      });
    }

    /* ── Active nav link on scroll ──────────────────── */
    const sections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a[href^="#"]');

    if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('id');
              navAnchors.forEach(function (a) {
                a.style.color = a.getAttribute('href') === '#' + id
                  ? 'var(--text)'
                  : '';
              });
            }
          });
        },
        { threshold: 0.4 }
      );

      sections.forEach(function (s) { sectionObserver.observe(s); });
    }

  }); // DOMContentLoaded
})();
