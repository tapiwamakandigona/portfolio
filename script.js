// ============================================
// Portfolio - Advanced Animation System
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // Loading Screen Handler
    // ============================================
    const loadingScreen = document.querySelector('.loading-screen');

    // Hide loading screen after content loads
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                document.body.classList.remove('loading');
            }
        }, 1500); // Minimum display time for branding
    });

    // Fallback - hide loading screen after max time
    setTimeout(() => {
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            loadingScreen.classList.add('hidden');
            document.body.classList.remove('loading');
        }
    }, 2000);

    // Extra safety - try to hide immediately if window already loaded
    if (document.readyState === 'complete') {
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                document.body.classList.remove('loading');
            }
        }, 500);
    }

    // ============================================
    // Theme Toggle (Dark/Light Mode)
    // ============================================
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    // Apply saved theme on load
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme === 'light' ? 'light' : '');
            localStorage.setItem('theme', newTheme);

            // Add a smooth transition class
            document.body.style.transition = 'background-color 0.5s ease, color 0.5s ease';
        });
    }

    // ============================================
    // Scroll Progress Bar
    // ============================================
    const scrollProgressBar = document.getElementById('scrollProgressBar');

    function updateScrollProgress() {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (scrollTop / docHeight) * 100;
        if (scrollProgressBar) {
            scrollProgressBar.style.width = `${Math.min(progress, 100)}%`;
        }
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // ============================================
    // Gradient Word Cycling Animation
    // ============================================
    const gradientWord = document.querySelector('.gradient-word');
    const words = ['Games', 'Web Apps', 'Experiences', 'Solutions', 'Ideas'];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDuration = 2000;

    function typeWord() {
        if (!gradientWord) return;

        const currentWord = words[wordIndex];

        if (isDeleting) {
            gradientWord.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
        } else {
            gradientWord.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
        }

        let timeout = isDeleting ? deletingSpeed : typingSpeed;

        if (!isDeleting && charIndex === currentWord.length) {
            timeout = pauseDuration;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            timeout = 500;
        }

        setTimeout(typeWord, timeout);
    }

    // Start typing animation
    setTimeout(typeWord, 1000);

    // ============================================
    // Custom Cursor (Desktop only)
    // ============================================
    const cursor = document.querySelector('.custom-cursor');

    if (cursor && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = `${e.clientX}px`;
            cursor.style.top = `${e.clientY}px`;
        });

        // Hover effect on interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .btn, .project-card, .nav-toggle');

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
            el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
        });

        // Click effect
        document.addEventListener('mousedown', () => cursor.classList.add('click'));
        document.addEventListener('mouseup', () => cursor.classList.remove('click'));
    }

    // ============================================
    // Mobile Navigation Toggle
    // ============================================
    const navToggle = document.getElementById('navToggle');
    const mobileNavOverlay = document.getElementById('mobileNavOverlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    function toggleMobileNav() {
        const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
        navToggle.setAttribute('aria-expanded', !isExpanded);

        navToggle.classList.toggle('active');
        mobileNavOverlay.classList.toggle('active');
        document.body.style.overflow = mobileNavOverlay.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileNav() {
        navToggle.setAttribute('aria-expanded', 'false');
        navToggle.classList.remove('active');
        mobileNavOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (navToggle) {
        navToggle.addEventListener('click', toggleMobileNav);
        navToggle.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleMobileNav();
        });
    }

    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                closeMobileNav();
            }
        });
    }

    // Mobile nav links - smooth scroll and close menu
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            closeMobileNav();

            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                setTimeout(() => {
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
        });
    });

    // ============================================
    // Smooth Scroll Navigation
    // ============================================
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    });

    sections.forEach(section => navObserver.observe(section));

    // ============================================
    // Navbar Scroll Effects
    // ============================================
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    let ticking = false;

    function updateNavbar() {
        const currentScroll = window.pageYOffset;

        // Add scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show on scroll direction
        if (currentScroll > lastScroll && currentScroll > 200) {
            navbar.classList.add('hidden');
        } else {
            navbar.classList.remove('hidden');
        }

        lastScroll = currentScroll;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateNavbar);
            ticking = true;
        }
    }, { passive: true });

    // ============================================
    // Scroll Reveal Animations
    // ============================================
    const revealElements = document.querySelectorAll(
        '.section-title, .about-text, .about-visual, .project-card, .contact-content'
    );

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Unobserve after animation to improve performance
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));

    // ============================================
    // Typing Effect - Enhanced (uses .typing-text element)
    // Note: This replaces the gradient word cycling above
    // ============================================
    // Typing effect is already handled by the gradient word cycling above
    // This section is removed to avoid duplicate functionality

    // ============================================
    // Parallax Effect for Background Orbs
    // ============================================
    const orbs = document.querySelectorAll('.gradient-orb');
    let orbsAnimating = false;

    function handleOrbParallax(e) {
        if (orbsAnimating) return;
        orbsAnimating = true;

        requestAnimationFrame(() => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            const moveX = (clientX - centerX) / 50;
            const moveY = (clientY - centerY) / 50;

            orbs.forEach((orb, index) => {
                const factor = (index + 1) * 0.5;
                orb.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
            });

            orbsAnimating = false;
        });
    }

    // Only enable on desktop
    if (window.matchMedia('(hover: hover)').matches) {
        window.addEventListener('mousemove', handleOrbParallax, { passive: true });
    }

    // ============================================
    // Project Card 3D Tilt Effect
    // ============================================
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        let ticking = false;

        card.addEventListener('mousemove', (e) => {
            if (ticking) return;
            ticking = true;

            requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                // Update CSS variables for spotlight effect
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = (y - centerY) / 25;
                const rotateY = (centerX - x) / 25;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;

                ticking = false;
            });
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
        });
    });

    // ============================================
    // Magnetic Button Effect
    // ============================================
    const magneticButtons = document.querySelectorAll('.btn, .social-link, .nav-github');

    magneticButtons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // ============================================
    // Smooth Scroll for All Anchor Links
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // ============================================
    // Particle Background Animation
    // ============================================
    const particleCanvas = document.getElementById('particles-canvas');

    if (particleCanvas && window.matchMedia('(min-width: 768px)').matches) {
        const ctx = particleCanvas.getContext('2d');
        let particles = [];
        const particleCount = 50;

        function resizeCanvas() {
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
        }

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * particleCanvas.width;
                this.y = Math.random() * particleCanvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.opacity = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x < 0 || this.x > particleCanvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > particleCanvas.height) this.speedY *= -1;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99, 102, 241, ${this.opacity})`;
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }

        function animateParticles() {
            ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);

            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            requestAnimationFrame(animateParticles);
        }

        animateParticles();
    }

    // ============================================
    // Staggered Text Reveal Animation
    // ============================================
    function splitTextIntoSpans(element) {
        if (!element) return;
        const text = element.textContent;
        element.innerHTML = '';

        text.split('').forEach((char, i) => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.animationDelay = `${i * 0.05}s`;
            span.classList.add('char-reveal');
            element.appendChild(span);
        });
    }

    // ============================================
    // Counter Animation
    // ============================================
    function animateCounter(element, target, duration = 2000) {
        if (!element) return;

        const start = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(easeOutQuart * target);

            element.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    // ============================================
    // Image Lazy Loading with Fade
    // ============================================
    const lazyImages = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px'
    });

    lazyImages.forEach(img => imageObserver.observe(img));

    // ============================================
    // Easter Egg - Konami Code
    // ============================================
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    document.addEventListener('keydown', (e) => {
        if (e.key === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                // Easter egg triggered!
                document.body.style.animation = 'rainbow 2s linear';
                setTimeout(() => {
                    document.body.style.animation = '';
                }, 2000);
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });

    // ============================================
    // Performance: Reduce animations on low-end devices
    // ============================================
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
        document.documentElement.classList.add('reduce-motion');
    }

    // ============================================
    // Console Easter Egg
    // ============================================
    console.log('%c🚀 Portfolio loaded successfully!', 'font-size: 20px; color: #6366f1; font-weight: bold;');
    console.log('%cBuilt with ❤️ by Tapiwa Makandigona', 'font-size: 14px; color: #a78bfa;');
    console.log('%c💡 Try the Konami Code!', 'font-size: 12px; color: #8b5cf6;');
});
