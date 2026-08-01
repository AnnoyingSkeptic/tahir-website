/* Subpage script — blog and legal pages.
   These have no hero video and no particle canvas, so main.js (which assumes
   both exist) would throw on them. This is the shared nav/reveal behaviour only. */

/* ── NAVBAR SCROLL ── */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 40);

  if (y < 80) {
    navbar.classList.remove('nav-hidden');
  } else if (y > lastScrollY + 8) {
    navbar.classList.add('nav-hidden');
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  } else if (y < lastScrollY - 8) {
    navbar.classList.remove('nav-hidden');
  }

  lastScrollY = y;
}, { passive: true });

/* ── MOBILE NAV ── */
hamburger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', open);
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

/* ── SCROLL REVEAL ── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const idx = [...entry.target.parentElement.children].indexOf(entry.target);
      entry.target.style.transitionDelay = (idx * 60) + 'ms';
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
