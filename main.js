/* ── VOLUME CONTROL ── */
const muteBtn      = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel  = document.getElementById('volumeLabel');
const heroVid      = document.getElementById('heroVideo');
const replayBtn    = document.getElementById('replayBtn');
const stopBtn      = document.getElementById('stopBtn');

/* ── VIDEO ENDED / STOPPED ── */
let videoEnded = false;

function onVideoStop() {
  videoEnded = true;
  heroVid.classList.add('ended');
  heroSection.classList.add('video-ended');
  stopBtn.classList.add('hidden');
  replayBtn.classList.add('visible');
  canvas.classList.add('expanded');
  resize(); initParticles();
}

function onVideoReplay() {
  videoEnded = false;
  heroVid.classList.remove('ended');
  heroSection.classList.remove('video-ended');
  replayBtn.classList.remove('visible');
  stopBtn.classList.remove('hidden');
  canvas.classList.remove('expanded');
  resize(); initParticles();
  heroVid.currentTime = 0;
  heroVid.play();
}

heroVid.addEventListener('ended', onVideoStop);
stopBtn.addEventListener('click', () => { heroVid.pause(); onVideoStop(); });
replayBtn.addEventListener('click', onVideoReplay);

/* start at 50% volume, muted (autoplay requirement) */
heroVid.volume = 0.5;

function syncMuteIcon() {
  const muted = heroVid.muted || heroVid.volume === 0;
  muteBtn.classList.toggle('unmuted', !muted);
  muteBtn.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
}

const volumeControl = document.getElementById('volumeControl');
const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

muteBtn.addEventListener('click', () => {
  heroVid.muted = !heroVid.muted;
  /* restore slider volume if it was dragged to 0 */
  if (!heroVid.muted && heroVid.volume === 0) {
    heroVid.volume = 0.5;
    volumeSlider.value = 50;
    volumeLabel.textContent = '50%';
  }
  syncMuteIcon();

  /* on touch devices: toggle the popup instead of relying on hover */
  if (isTouchDevice()) {
    volumeControl.classList.toggle('popup-open');
  }
});

/* close popup when tapping outside on touch devices */
document.addEventListener('touchstart', (e) => {
  if (isTouchDevice() && !volumeControl.contains(e.target)) {
    volumeControl.classList.remove('popup-open');
    volumeControl.querySelector(':focus')?.blur();
  }
}, { passive: true });

volumeSlider.addEventListener('input', () => {
  const val = parseInt(volumeSlider.value, 10);
  heroVid.volume = val / 100;
  volumeLabel.textContent = val + '%';
  /* dragging to 0 counts as mute; any value above 0 unmutes */
  heroVid.muted = val === 0;
  syncMuteIcon();
});

/* ── NAVBAR SCROLL ── */
const navbar = document.getElementById('navbar');
let lastScrollY = 0;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('scrolled', y > 40);

  if (y < 80) {
    navbar.classList.remove('nav-hidden');
  } else if (y > lastScrollY + 8) {
    navbar.classList.add('nav-hidden');
    /* also close mobile menu if open */
    mobileMenu.classList.remove('open');
    hamburger.classList.remove('open');
  } else if (y < lastScrollY - 8) {
    navbar.classList.remove('nav-hidden');
  }

  lastScrollY = y;
}, { passive: true });

/* ── MOBILE NAV ── */
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

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

/* ── TYPING ANIMATION ── */
const roles = [
  'Guitarist',
  'Session Musician',
  'Sound Engineer',
  'Mix & Master',
  'Game Audio',
  'Sound Design',
];

const typedEl = document.getElementById('typedRole');
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
let pauseTimer = null;

function type() {
  const current = roles[roleIndex];

  if (!deleting) {
    charIndex++;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === current.length) {
      pauseTimer = setTimeout(() => { deleting = true; type(); }, 2000);
      return;
    }
  } else {
    charIndex--;
    typedEl.textContent = current.slice(0, charIndex);
    if (charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }
  }

  const speed = deleting ? 50 : 90;
  setTimeout(type, speed);
}

type();

/* ── SCROLL REVEAL ── */
const revealEls = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const allSiblings = [...entry.target.parentElement.children];
      const idx = allSiblings.indexOf(entry.target);
      entry.target.style.transitionDelay = (idx * 80) + 'ms';
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

/* ── HERO CANVAS (particle mesh) ── */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
const heroVideo = document.getElementById('heroVideo');

let W, H, particles;
const CONNECT_DIST = 160;
const particleCount = () => window.innerWidth < 768 ? 40 : 110;

function resize() {
  W = canvas.width = canvas.offsetWidth;
  H = canvas.height = canvas.offsetHeight;
}

function initParticles() {
  particles = Array.from({ length: particleCount() }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
  }));
}

let animRunning = true;
let animFrameId = null;

function drawFrame() {
  if (!animRunning) return;
  animFrameId = requestAnimationFrame(drawFrame);
  ctx.clearRect(0, 0, W, H);

  const videoPlaying = heroVideo && heroVideo.readyState >= 3 && !heroVideo.paused;

  if (!videoPlaying) {
    /* solid base so canvas covers the full area as a background */
    ctx.fillStyle = 'rgb(8,10,14)';
    ctx.fillRect(0, 0, W, H);
    if (videoEnded) {
      /* subtle colour glows over the solid base */
      const bg = ctx.createRadialGradient(W * 0.25, H * 0.45, 0, W * 0.4, H * 0.5, W * 0.75);
      bg.addColorStop(0,   'rgba(0,90,130,0.5)');
      bg.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      const bg2 = ctx.createRadialGradient(W * 0.75, H * 0.3, 0, W * 0.7, H * 0.4, W * 0.5);
      bg2.addColorStop(0,   'rgba(80,40,140,0.25)');
      bg2.addColorStop(1,   'rgba(0,0,0,0)');
      ctx.fillStyle = bg2;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const dotOpacity  = videoEnded ? 0.85 : 0.55;
  const lineOpacity = videoEnded ? 0.22 : 0.12;
  const radiusScale = videoEnded ? 1.8  : 1.0;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * radiusScale, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,212,255,${dotOpacity})`;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const q = particles[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(0,212,255,${lineOpacity * (1 - dist / CONNECT_DIST)})`;
        ctx.lineWidth = videoEnded ? 0.9 : 0.6;
        ctx.stroke();
      }
    }
  }
}

/* pause animation when hero is not visible — saves battery on mobile */
const heroSection = document.getElementById('hero');
const heroVisibilityObserver = new IntersectionObserver((entries) => {
  const visible = entries[0].isIntersecting;
  if (visible && !animRunning) {
    animRunning = true;
    drawFrame();
  } else if (!visible && animRunning) {
    animRunning = false;
    cancelAnimationFrame(animFrameId);
  }
}, { threshold: 0.01 });
heroVisibilityObserver.observe(heroSection);

window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
/* defer initial sizing to next paint so 100svh is fully computed */
requestAnimationFrame(() => { resize(); initParticles(); drawFrame(); });

/* ── SMOOTH SCROLL (fallback for older Safari) ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
