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
}

function onVideoReplay() {
  videoEnded = false;
  heroVid.classList.remove('ended');
  heroSection.classList.remove('video-ended');
  replayBtn.classList.remove('visible');
  stopBtn.classList.remove('hidden');
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

/* ── TYPING ANIMATION ──
   Roles come from data-roles on #typedRole so the Turkish homepage can supply
   its own list without forking this file. */
const typedEl = document.getElementById('typedRole');

const roles = (typedEl.dataset.roles || '')
  .split('|').map(s => s.trim()).filter(Boolean);

if (!roles.length) {
  roles.push('Guitarist', 'Session Musician', 'Sound Engineer',
             'Mix & Master', 'Game Audio', 'Sound Design');
}
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

/* ── HERO CANVAS (particle mesh / star sparkle) ── */
const canvas = document.getElementById('heroCanvas');
const ctx = canvas.getContext('2d');
const heroVideo = document.getElementById('heroVideo');

let W, H, particles;
const CONNECT_DIST = 180;
const particleCount = () => window.innerWidth < 768 ? 65 : 200;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}

function initParticles() {
  particles = Array.from({ length: particleCount() }, () => {
    const t = Math.random();
    return {
      x:  Math.random() * W,
      y:  Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r:  Math.random() * 1.8 + 0.5,
      phase:        Math.random() * Math.PI * 2,
      twinkleSpeed: 0.012 + Math.random() * 0.03,
      baseOpacity:  0.4  + Math.random() * 0.55,
      cr: Math.round(255 - 255 * t),
      cg: Math.round(255 - 43  * t),
    };
  });
}

let animRunning = true;
let animFrameId = null;
let gradientTime = 0;

/* ── SHOOTING STAR SYSTEM ── */
const METEOR_COUNT = 6;
let meteors = [];

function spawnMeteor(scatter) {
  const angle = Math.random() * Math.PI * 2; // fully random direction
  const speed = (W + H) * (0.000055 + Math.random() * 0.000035);
  const len   = W  * (0.18 + Math.random() * 0.16);
  const thick = H  * (0.004 + Math.random() * 0.003);

  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  /* spawn from whichever edge the meteor is coming from */
  let sx, sy;
  if (Math.abs(cos) >= Math.abs(sin)) {
    sx = cos > 0 ? -len : W + len;
    sy = Math.random() * H;
  } else {
    sx = Math.random() * W;
    sy = sin > 0 ? -len : H + len;
  }

  if (scatter) {
    const d = Math.random() * (W + H);
    sx += cos * d;
    sy += sin * d;
  }

  return {
    x: sx, y: sy,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    angle, len, thick,
    hue:   185 + Math.random() * 90,
    alpha: 0.28 + Math.random() * 0.18,
  };
}

function initMeteors() {
  meteors = Array.from({ length: METEOR_COUNT }, () => spawnMeteor(true));
}

function drawMeteor(m) {
  ctx.save();
  ctx.translate(m.x, m.y);
  ctx.rotate(m.angle);

  /* wedge: tail tip at (-len, 0), head at origin (0, 0)
     gradient is almost entirely invisible until the last 20% — sharp spike at head */
  const hw = m.thick * 0.5;
  const g  = ctx.createLinearGradient(-m.len, 0, 0, 0);
  g.addColorStop(0,    'rgba(0,0,0,0)');
  g.addColorStop(0.70, 'rgba(0,0,0,0)');
  g.addColorStop(0.88, `hsla(${m.hue},80%,65%,${m.alpha * 0.25})`);
  g.addColorStop(0.96, `hsla(${m.hue},90%,75%,${m.alpha * 0.75})`);
  g.addColorStop(1,    `hsla(${m.hue},95%,88%,${m.alpha})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-m.len, 0);
  ctx.lineTo(0,  hw);
  ctx.lineTo(0, -hw);
  ctx.closePath();
  ctx.fill();

  /* white core — only visible near the head */
  const core = ctx.createLinearGradient(-m.len, 0, 0, 0);
  core.addColorStop(0,    'rgba(255,255,255,0)');
  core.addColorStop(0.82, 'rgba(255,255,255,0)');
  core.addColorStop(0.94, `rgba(255,255,255,${m.alpha * 0.35})`);
  core.addColorStop(1,    `rgba(255,255,255,${m.alpha * 0.65})`);
  ctx.strokeStyle = core;
  ctx.lineWidth   = 0.5;
  ctx.beginPath();
  ctx.moveTo(-m.len, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();

  /* tight pin-point glow at the head */
  const headR = m.thick * 1.6;
  const glow  = ctx.createRadialGradient(0, 0, 0, 0, 0, headR);
  glow.addColorStop(0,   `rgba(255,255,255,${m.alpha * 0.9})`);
  glow.addColorStop(0.3, `hsla(${m.hue},95%,88%,${m.alpha * 0.5})`);
  glow.addColorStop(1,   'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawFrame() {
  if (!animRunning) return;
  animFrameId = requestAnimationFrame(drawFrame);
  ctx.clearRect(0, 0, W, H);

  /* ── DARK BASE ── */
  gradientTime += 0.0018;
  ctx.fillStyle = 'rgb(8,10,14)';
  ctx.fillRect(0, 0, W, H);

  /* ── SHOOTING STARS ── */
  for (let i = 0; i < meteors.length; i++) {
    const m = meteors[i];
    m.x += m.vx;
    m.y += m.vy;
    if (m.x > W + m.len || m.y > H + m.len || m.x < -m.len || m.y < -m.len) meteors[i] = spawnMeteor(false);
    else drawMeteor(m);
  }

  /* ── SPARSE PARTICLES + FAINT LINES ── */
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > W) p.vx *= -1;
    if (p.y < 0 || p.y > H) p.vy *= -1;

    p.phase += p.twinkleSpeed;
    const tw = 0.5 + 0.5 * Math.sin(p.phase);
    const op = p.baseOpacity * tw * 0.9;
    const r  = p.r * (0.75 + 0.35 * tw);

    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    /* lean cyan: mix white→cyan but keep it cold/techy */
    ctx.fillStyle = `rgba(${p.cr},${p.cg},255,${op})`;
    ctx.fill();

    for (let j = i + 1; j < particles.length; j++) {
      const q    = particles[j];
      const dx   = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(0,212,255,${0.13 * (1 - dist / CONNECT_DIST)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }
}

const heroSection = document.getElementById('hero');

/* pause animation when tab is hidden */
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    animRunning = false;
    cancelAnimationFrame(animFrameId);
  } else {
    animRunning = true;
    drawFrame();
  }
});

window.addEventListener('resize', () => { resize(); initParticles(); initMeteors(); }, { passive: true });
requestAnimationFrame(() => { resize(); initParticles(); initMeteors(); drawFrame(); });

/* ── EMBED FACADES ──
   The portfolio ships poster images, not iframes. YouTube / SoundCloud are only
   contacted once the visitor presses play, so a cold page load makes zero
   third-party requests and sets zero cookies. Swaps in the real player on click. */
document.querySelectorAll('.embed-facade').forEach(facade => {
  function activate(e) {
    /* let the "cookies" link in the notice behave like a link */
    if (e.target.closest('a')) return;

    const iframe = document.createElement('iframe');
    iframe.title = facade.dataset.title || '';
    iframe.setAttribute('frameborder', '0');

    if (facade.dataset.embed === 'youtube') {
      /* youtube-nocookie.com — no cookies until playback actually starts */
      iframe.src = 'https://www.youtube-nocookie.com/embed/' +
                   encodeURIComponent(facade.dataset.id) + '?autoplay=1&rel=0';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
    } else {
      iframe.src = 'https://w.soundcloud.com/player/?url=' +
                   encodeURIComponent(facade.dataset.url) +
                   '&color=%2300d4ff&auto_play=true&hide_related=true' +
                   '&show_comments=false&show_user=true&show_reposts=false&show_teaser=false';
      iframe.allow = 'autoplay';
      iframe.setAttribute('scrolling', 'no');
    }

    facade.replaceWith(iframe);
  }

  facade.addEventListener('click', activate);
  facade.querySelector('.facade-play').addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); }
  });
});

/* ── SMOOTH SCROLL (fallback for older Safari) ── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});
