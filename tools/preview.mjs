// Visual preview / smoke test for the site via Playwright (bundled Chromium).
// Usage:
//   cd tools && npm install        # one-time (playwright is cached system-wide)
//   node preview.mjs               # shoots live site
//   node preview.mjs http://localhost:8080   # shoots a local dev server
//
// Why this exists: file:// caching hides shipped changes, and scroll-reveal
// sections only render when scrolled into view, so a plain fullPage shot shows
// them blank. This scrolls to each section to trigger IntersectionObserver.
//
// Gotcha: use waitUntil:'load', NOT 'networkidle' — the autoplay hero video
// keeps the network busy forever and networkidle times out.

import { chromium } from 'playwright';

const url = process.argv[2] || 'https://tahiralaybeyi.com';
const out = process.argv[3] || '/tmp';
const SECTIONS = ['hero', 'about', 'skills', 'portfolio', 'contact'];

async function settle(page) {
  // scroll through the whole page to trigger every IntersectionObserver reveal
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(600);
}

async function shoot(browser, label, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: mobile ? 3 : 2, isMobile: mobile });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  const resp = await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(2000); // canvas + video settle
  await settle(page);

  // hero (top of page) + per-section element shots
  await page.screenshot({ path: `${out}/${label}-hero.png` });
  for (const id of SECTIONS) {
    const el = await page.$(`#${id}`);
    if (!el) continue;
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400); // let reveal transition finish
    await el.screenshot({ path: `${out}/${label}-${id}.png` }).catch(() => {});
  }
  const info = { label, status: resp ? resp.status() : 'none', title: await page.title(), errors };
  await ctx.close();
  return info;
}

const browser = await chromium.launch();
const results = [];
results.push(await shoot(browser, 'desktop', { width: 1440, height: 900 }, false));
results.push(await shoot(browser, 'mobile', { width: 390, height: 844 }, true));
await browser.close();
console.log(JSON.stringify({ url, out, results }, null, 2));
