// Privacy smoke test — asserts the claim the Cookie Policy makes:
// a cold page load contacts NO third party and sets NO cookies, on every page,
// and the embeds still actually work once you press play.
//
//   python3 -m http.server 8080          # in the repo root, first
//   node tools/privacy-check.mjs         # then this
//
// Exits non-zero on any failure. If this fails, cookies.html is lying.

import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const origin = new URL(base).host;

const PAGES = [
  '/', '/tr/',
  '/blog/', '/tr/blog/',
  '/privacy.html', '/cookies.html',
  '/tr/gizlilik.html', '/tr/cerezler.html',
  '/blog/remote-session-checklist.html',
  '/tr/blog/uzaktan-kayit-kontrol-listesi.html',
];

const results = [];
const record = (name, pass, detail = '') => results.push({ name, pass, detail });

const browser = await chromium.launch();

for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  const foreign = new Set();
  const errors = [];
  const broken = [];

  page.on('request', r => {
    const h = new URL(r.url()).host;
    if (h && h !== origin) foreign.add(h);
  });
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('response', r => { if (r.status() >= 400) broken.push(`${r.url()} → ${r.status()}`); });

  await page.goto(base + path, { waitUntil: 'load', timeout: 30000 });
  // scroll the whole page so lazy images and reveal sections actually fire
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 40));
    }
  });
  await page.waitForTimeout(1200);

  const cookies = await ctx.cookies();

  record(`${path} — no third-party requests`, foreign.size === 0, [...foreign].join(', '));
  record(`${path} — no cookies set`, cookies.length === 0, cookies.map(c => `${c.name}@${c.domain}`).join(', '));
  record(`${path} — no console errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
  record(`${path} — no failed requests`, broken.length === 0, broken.slice(0, 2).join(' | '));

  await ctx.close();
}

/* ── facades must still work once clicked ── */
for (const [path, label] of [['/', 'EN'], ['/tr/', 'TR']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: 'load' });

  const facades = await page.locator('.embed-facade').count();
  record(`${label} homepage — 5 facades present`, facades === 5, `found ${facades}`);

  // YouTube facade
  await page.locator('.embed-facade[data-embed="youtube"]').first().click();
  await page.waitForTimeout(600);
  const ytSrc = await page.locator('.project-embed iframe').first().getAttribute('src').catch(() => null);
  record(`${label} homepage — play swaps in youtube-nocookie iframe`,
         !!ytSrc && ytSrc.includes('youtube-nocookie.com/embed/'), ytSrc || 'no iframe');

  // SoundCloud facade
  await page.locator('.embed-facade[data-embed="soundcloud"]').click();
  await page.waitForTimeout(600);
  const scSrc = await page.locator('.sc-embed iframe').getAttribute('src').catch(() => null);
  record(`${label} homepage — play swaps in SoundCloud player`,
         !!scSrc && scSrc.includes('w.soundcloud.com/player'), scSrc || 'no iframe');

  // the "cookies" link inside a facade must navigate, not start playback
  const p2 = await ctx.newPage();
  await p2.goto(base + path, { waitUntil: 'load' });
  await p2.locator('.facade-note a').first().click();
  await p2.waitForTimeout(600);
  record(`${label} homepage — cookie link navigates instead of playing`,
         /cookies\.html|cerezler\.html/.test(p2.url()), p2.url());

  await ctx.close();
}

/* ── the Turkish pages must actually render Turkish glyphs (latin-ext) ── */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base + '/tr/', { waitUntil: 'load' });
  const txt = await page.locator('body').innerText();
  record('TR homepage — Turkish glyphs present', /[ğışİĞŞ]/.test(txt),
         (txt.match(/[ğışİĞŞ]/g) || []).slice(0, 6).join(''));
  await ctx.close();
}

await browser.close();

/* ── report ── */
const failed = results.filter(r => !r.pass);
for (const r of results) {
  console.log(`${r.pass ? '  ✓' : '  ✗'} ${r.name}${r.detail && !r.pass ? `\n      ${r.detail}` : ''}`);
}
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
