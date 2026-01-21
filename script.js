// ============================================
// Smooth Scrolling & Navigation
// ============================================
document.addEventListener('DOMContentLoaded', () => {
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
        // Touch support for mobile
        navToggle.addEventListener('touchend', (e) => {
            e.preventDefault();
            toggleMobileNav();
        });
    }

    // Close mobile nav when clicking overlay
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
                    targetSection.scrollIntoView({
                        behavior: 'smooth'
                    });
                }, 300);
            }
        });
    });

    // Navigation links smooth scroll
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Active nav link on scroll
    const sections = document.querySelectorAll('section[id]');

    const observerOptions = {
        root: null,
        rootMargin: '-50% 0px -50% 0px',
        threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
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
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // ============================================
    // Navbar Background on Scroll
    // ============================================
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
            navbar.style.padding = '12px 0';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.8)';
            navbar.style.padding = '20px 0';
        }

        lastScroll = currentScroll;
    });

    // ============================================
    // Reveal Animations on Scroll
    // ============================================
    const revealElements = document.querySelectorAll('.section-title, .about-text, .about-visual, .project-card, .contact-content');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        revealObserver.observe(el);
    });

    // ============================================
    // Typing Effect Enhancement
    // ============================================
    const titles = ['Developer', 'Game Creator', 'Problem Solver', 'Code Enthusiast'];
    let titleIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typingElement = document.querySelector('.typing-text');

    function typeEffect() {
        const currentTitle = titles[titleIndex];

        if (isDeleting) {
            typingElement.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;
        } else {
            typingElement.textContent = currentTitle.substring(0, charIndex + 1);
            charIndex++;
        }

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && charIndex === currentTitle.length) {
            typeSpeed = 2000;
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            titleIndex = (titleIndex + 1) % titles.length;
            typeSpeed = 500;
        }

        setTimeout(typeEffect, typeSpeed);
    }

    // Start typing effect after initial load
    setTimeout(typeEffect, 2000);

    // ============================================
    // Parallax Effect for Background Orbs
    // ============================================
    const orbs = document.querySelectorAll('.gradient-orb');

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        const moveX = (clientX - centerX) / 50;
        const moveY = (clientY - centerY) / 50;

        orbs.forEach((orb, index) => {
            const factor = (index + 1) * 0.5;
            orb.style.transform = `translate(${moveX * factor}px, ${moveY * factor}px)`;
        });
    });

    // ============================================
    // Project Card Tilt Effect
    // ============================================
    const projectCards = document.querySelectorAll('.project-card');

    projectCards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    console.log('🚀 Portfolio loaded successfully!');
});
