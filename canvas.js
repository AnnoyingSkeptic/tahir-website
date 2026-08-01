/* ── BACKGROUND CANVAS (particle mesh + shooting stars) ──
   Shared by the homepages and the subpages. Loaded before main.js / page.js.

   Density is tuned per page via data attributes on <canvas id="heroCanvas">:

     data-density  particle-count multiplier   (default 1)
     data-meteors  shooting stars              (default 6)
     data-alpha    overall opacity multiplier  (default 1)
     data-mesh     "responsive" scales the connection radius to viewport width

   data-mesh matters on phones: the 180px connection radius is fine on a 1440px
   desktop but spans half a 375px screen, so the mesh reads as dense clutter
   exactly where it should be calm. "responsive" caps it at 30% of viewport
   width. The homepages deliberately omit it, so their look is unchanged.

   Homepages run it at full strength. Subpages run it thinned out and dimmed —
   same system, same theme, but long-form text has to stay readable on top of it. */

(() => {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const ds = canvas.dataset;
  const DENSITY = parseFloat(ds.density ?? '1');
  const METEOR_COUNT = parseInt(ds.meteors ?? '6', 10);
  const ALPHA = parseFloat(ds.alpha ?? '1');

  let W, H, particles;
  const CONNECT_BASE = 180;
  const RESPONSIVE_MESH = ds.mesh === 'responsive';
  let CONNECT_DIST = CONNECT_BASE;

  const particleCount = () =>
    Math.max(8, Math.round((window.innerWidth < 768 ? 65 : 200) * DENSITY));

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    CONNECT_DIST = RESPONSIVE_MESH
      ? Math.min(CONNECT_BASE, Math.max(80, W * 0.30))
      : CONNECT_BASE;
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

  /* ── SHOOTING STAR SYSTEM ── */
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
      alpha: (0.28 + Math.random() * 0.18) * ALPHA,
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
      const op = p.baseOpacity * tw * 0.9 * ALPHA;
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
          ctx.strokeStyle = `rgba(0,212,255,${0.13 * ALPHA * (1 - dist / CONNECT_DIST)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

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
})();
