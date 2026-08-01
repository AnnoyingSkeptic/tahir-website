/* ── VOLUME CONTROL ── */
const muteBtn      = document.getElementById('muteBtn');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel  = document.getElementById('volumeLabel');
const heroVid      = document.getElementById('heroVideo');
const replayBtn    = document.getElementById('replayBtn');
const stopBtn      = document.getElementById('stopBtn');
const heroSection  = document.getElementById('hero');

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
