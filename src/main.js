import { UIManager } from './uiManager.js';

/**
 * main.js
 * ---------------------------------------------------------------------------
 * Bootstrap : initialise l'UI, branche la navigation sticky, le parallax
 * léger du hero, les reveal-on-scroll via IntersectionObserver et l'année
 * dynamique du footer.
 */

const ui = new UIManager();

ui.init().catch((err) => {
    console.error('[Little Mamma] init error', err);
});

// ---------------------------------------------------------------------------
// Sticky navigation : on bascule visuellement après 80 px de scroll.
// ---------------------------------------------------------------------------
const nav = document.getElementById('topnav');
let lastY = -1;
const onScroll = () => {
    const y = window.scrollY;
    if ((y > 60) !== (lastY > 60)) {
        nav.classList.toggle('is-stuck', y > 60);
    }
    // Parallax léger sur l'image du hero (translation y proportionnelle).
    if (heroImg && y < window.innerHeight) {
        heroImg.style.transform = `translateY(${y * 0.25}px) scale(1.05)`;
    }
    lastY = y;
};

const heroImg = document.querySelector('.hero__img');
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------------------------------------------------------------------------
// Reveal-on-scroll : ajoute is-visible quand l'élément entre dans le viewport
// (seuil 15 %). On désobserve aussitôt pour éviter le retrigger.
// ---------------------------------------------------------------------------
const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
        }
    }
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

// ---------------------------------------------------------------------------
// Smooth-scroll vers les ancres internes en compensant la hauteur du nav.
// ---------------------------------------------------------------------------
document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        const offset = 70;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
    });
});

// ---------------------------------------------------------------------------
// Footer year
// ---------------------------------------------------------------------------
const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());
