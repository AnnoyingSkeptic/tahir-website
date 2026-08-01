#!/usr/bin/env node
/**
 * Static page builder for tahiralaybeyi.com
 *
 * Renders markdown in content/ into plain static HTML at the repo root.
 * There is no framework and no CI step — you run this by hand, commit the
 * generated .html, and GitHub Pages serves it as-is.
 *
 *   node tools/build.mjs
 *
 * Sources:
 *   content/posts/{en,tr}/*.md   -> blog/<slug>.html   + tr/blog/<slug>.html
 *   content/legal/{en,tr}/*.md   -> <slug>.html        + tr/<slug>.html
 *
 * Translation pairing: two files are the same page in different languages when
 * they share a FILENAME. The `slug` front-matter field controls the URL, so
 * legal/en/privacy.md and legal/tr/privacy.md pair up while still publishing to
 * /privacy.html and /tr/gizlilik.html respectively.
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://tahiralaybeyi.com';
const LANGS = ['en', 'tr'];

/* ── UI strings ───────────────────────────────────────────────────────────── */

const T = {
  en: {
    nav:      { about: 'About', skills: 'Skills', work: 'Work', blog: 'Blog', contact: 'Contact' },
    other:    'TR',
    otherFull:'Türkçe',
    blogTitle:'Blog',
    blogLead: 'Notes on guitar, production, and audio work.',
    backToBlog:'← All posts',
    backHome: '← Home',
    privacy:  'Privacy Notice',
    cookies:  'Cookie Policy',
    rights:   'All rights reserved.',
    empty:    'No posts yet.',
    updated:  'Last updated',
    locale:   'en-US',
  },
  tr: {
    nav:      { about: 'Hakkımda', skills: 'Neler Yapıyorum', work: 'İşler', blog: 'Blog', contact: 'İletişim' },
    other:    'EN',
    otherFull:'English',
    blogTitle:'Blog',
    blogLead: 'Gitar, prodüksiyon ve ses işleri üzerine notlar.',
    backToBlog:'← Tüm yazılar',
    backHome: '← Anasayfa',
    privacy:  'Aydınlatma Metni',
    cookies:  'Çerez Politikası',
    rights:   'Tüm hakları saklıdır.',
    empty:    'Henüz yazı yok.',
    updated:  'Son güncelleme',
    locale:   'tr-TR',
  },
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Minimal front-matter reader: `key: value` pairs, plus `[a, b]` lists. */
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let v = kv[2].trim().replace(/^["'](.*)["']$/, '$1');
    if (/^\[.*\]$/.test(v)) {
      v = v.slice(1, -1).split(',').map(s => s.trim().replace(/^["'](.*)["']$/, '$1')).filter(Boolean);
    }
    data[kv[1]] = v;
  }
  return { data, body: raw.slice(m[0].length) };
}

function fmtDate(iso, lang) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00Z' : ''));
  if (isNaN(d)) return '';
  return new Intl.DateTimeFormat(T[lang].locale, {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  }).format(d);
}

function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(f => f.endsWith('.md')).sort();
}

function write(outPath, html) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  return relative(ROOT, outPath);
}

/* ── page template ────────────────────────────────────────────────────────── */

/**
 * @param o.outPath  path relative to repo root, e.g. "tr/blog/post.html"
 * @param o.altPath  same page in the other language, or null
 */
function layout(o) {
  const t = T[o.lang];
  const other = o.lang === 'en' ? 'tr' : 'en';

  // depth of the output file decides how many ../ get us back to the root
  const depth = o.outPath.split('/').length - 1;
  const up = depth === 0 ? '' : '../'.repeat(depth);
  const homeHref = o.lang === 'en' ? `${up}index.html` : `${up}tr/index.html`;
  const langRoot = o.lang === 'en' ? up : `${up}tr/`;

  const canonical = `${SITE}/${o.outPath}`.replace(/\/index\.html$/, '/');
  const altUrl = o.altPath ? `${SITE}/${o.altPath}`.replace(/\/index\.html$/, '/') : null;
  const enUrl = o.lang === 'en' ? canonical : altUrl;
  const trUrl = o.lang === 'tr' ? canonical : altUrl;

  const alternates = [
    enUrl ? `  <link rel="alternate" hreflang="en" href="${esc(enUrl)}" />` : '',
    trUrl ? `  <link rel="alternate" hreflang="tr" href="${esc(trUrl)}" />` : '',
    enUrl ? `  <link rel="alternate" hreflang="x-default" href="${esc(enUrl)}" />` : '',
  ].filter(Boolean).join('\n');

  // language switch target: the translated page if it exists, else that language's home
  const switchHref = o.altPath ? `${up}${o.altPath}`.replace(/\/index\.html$/, '/')
                               : (o.lang === 'en' ? `${up}tr/` : up || './');

  return `<!DOCTYPE html>
<html lang="${o.lang}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(o.title)} — Tahir Alaybeyi</title>
  <meta name="description" content="${esc(o.description || '')}" />
  <meta name="author" content="Tahir Alaybeyi" />
  <meta name="robots" content="${o.noindex ? 'noindex, follow' : 'index, follow'}" />

  <link rel="canonical" href="${esc(canonical)}" />
${alternates}

  <meta property="og:type" content="${o.type === 'post' ? 'article' : 'website'}" />
  <meta property="og:title" content="${esc(o.title)}" />
  <meta property="og:description" content="${esc(o.description || '')}" />
  <meta property="og:url" content="${esc(canonical)}" />
  <meta property="og:image" content="${SITE}/assets/og-image.jpg" />
  <meta property="og:locale" content="${o.lang === 'tr' ? 'tr_TR' : 'en_US'}" />

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(o.title)}" />
  <meta name="twitter:description" content="${esc(o.description || '')}" />
  <meta name="twitter:image" content="${SITE}/assets/og-image.jpg" />

  <link rel="icon" type="image/svg+xml" href="${up}assets/favicon.svg" />
  <link rel="stylesheet" href="${up}style.css" />
  <!-- Fonts are self-hosted in assets/fonts/ — no third-party request on load. -->
  <link rel="preload" href="${up}assets/fonts/montserrat-latin.woff2" as="font" type="font/woff2" crossorigin />
  <link rel="preload" href="${up}assets/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin />
</head>
<body class="subpage">

  <!-- Same particle/meteor system as the homepage, thinned out and dimmed so
       long-form text stays readable on top of it. See canvas.js. -->
  <canvas id="heroCanvas" data-density="0.7" data-meteors="4" data-alpha="0.8" data-mesh="responsive"></canvas>

  <nav id="navbar">
    <div class="nav-inner">
      <ul class="nav-links">
        <li><a href="${homeHref}#about">${t.nav.about}</a></li>
        <li><a href="${homeHref}#skills">${t.nav.skills}</a></li>
        <li><a href="${homeHref}#portfolio">${t.nav.work}</a></li>
        <li><a href="${langRoot}blog/">${t.nav.blog}</a></li>
        <li><a href="${homeHref}#contact" class="nav-cta">${t.nav.contact}</a></li>
        <li class="nav-lang">
          <span class="lang-current" aria-current="true">${o.lang.toUpperCase()}</span>
          <span class="lang-sep" aria-hidden="true">/</span>
          <a href="${esc(switchHref)}" hreflang="${other}" lang="${other}">${t.other}</a>
        </li>
      </ul>
      <button class="hamburger" id="hamburger" aria-label="${o.lang === 'tr' ? 'Menüyü aç/kapat' : 'Toggle menu'}">
        <span></span><span></span><span></span>
      </button>
    </div>
    <div class="mobile-menu" id="mobileMenu">
      <a href="${homeHref}#about" class="mobile-link">${t.nav.about}</a>
      <a href="${homeHref}#skills" class="mobile-link">${t.nav.skills}</a>
      <a href="${homeHref}#portfolio" class="mobile-link">${t.nav.work}</a>
      <a href="${langRoot}blog/" class="mobile-link">${t.nav.blog}</a>
      <a href="${homeHref}#contact" class="mobile-link">${t.nav.contact}</a>
      <a href="${esc(switchHref)}" class="mobile-link mobile-lang" hreflang="${other}" lang="${other}">${t.otherFull}</a>
    </div>
  </nav>

  <main class="page">
    <div class="container">
${o.content}
    </div>
  </main>

  <footer>
    <div class="container">
      <nav class="footer-links" aria-label="${o.lang === 'tr' ? 'Yasal' : 'Legal'}">
        <a href="${langRoot}blog/">${t.nav.blog}</a>
        <a href="${langRoot}${o.lang === 'tr' ? 'gizlilik' : 'privacy'}.html">${t.privacy}</a>
        <a href="${langRoot}${o.lang === 'tr' ? 'cerezler' : 'cookies'}.html">${t.cookies}</a>
        <a href="${esc(switchHref)}" hreflang="${other}" lang="${other}">${t.otherFull}</a>
      </nav>
      <p>&copy; 2026 Tahir Alaybeyi. ${t.rights}</p>
    </div>
  </footer>

  <script src="${up}canvas.js"></script>
  <script src="${up}page.js"></script>
</body>
</html>
`;
}

/* ── collect sources ──────────────────────────────────────────────────────── */

function collect(kind) {
  const out = {};
  for (const lang of LANGS) {
    const dir = join(ROOT, 'content', kind, lang);
    for (const file of readDir(dir)) {
      const key = basename(file, '.md');
      const raw = readFileSync(join(dir, file), 'utf8');
      const { data, body } = parseFrontMatter(raw);
      (out[key] ??= {})[lang] = {
        key, lang, data, body,
        slug: data.slug || key,
        title: data.title || key,
        description: data.description || '',
        date: data.date || '',
      };
    }
  }
  return out;
}

const outPathFor = (kind, lang, slug) =>
  kind === 'posts'
    ? (lang === 'en' ? `blog/${slug}.html` : `tr/blog/${slug}.html`)
    : (lang === 'en' ? `${slug}.html` : `tr/${slug}.html`);

/* ── build ────────────────────────────────────────────────────────────────── */

marked.setOptions({ mangle: false, headerIds: false });

const written = [];
const urls = [];

for (const kind of ['posts', 'legal']) {
  const groups = collect(kind);

  for (const [key, byLang] of Object.entries(groups)) {
    for (const lang of LANGS) {
      const page = byLang[lang];
      if (!page) {
        console.warn(`  ! ${kind}/${key}: missing ${lang.toUpperCase()} translation — no ${lang} page generated`);
        continue;
      }
      const other = lang === 'en' ? 'tr' : 'en';
      const altPath = byLang[other] ? outPathFor(kind, other, byLang[other].slug) : null;
      const outPath = outPathFor(kind, lang, page.slug);
      const t = T[lang];

      const meta = kind === 'posts' && page.date
        ? `      <p class="post-meta"><time datetime="${esc(page.date)}">${esc(fmtDate(page.date, lang))}</time></p>\n`
        : (kind === 'legal' && page.date
            ? `      <p class="post-meta">${esc(t.updated)}: <time datetime="${esc(page.date)}">${esc(fmtDate(page.date, lang))}</time></p>\n`
            : '');

      const back = kind === 'posts'
        ? `      <p class="page-back"><a href="./">${esc(t.backToBlog)}</a></p>\n`
        : `      <p class="page-back"><a href="${lang === 'en' ? '../index.html' : '../tr/index.html'}">${esc(t.backHome)}</a></p>\n`;

      const content =
        `      <article class="prose">\n` +
        `        <h1>${esc(page.title)}</h1>\n` +
        meta +
        marked.parse(page.body).split('\n').map(l => l ? '        ' + l : l).join('\n') + '\n' +
        `      </article>\n` +
        back;

      written.push(write(join(ROOT, outPath), layout({
        lang, outPath, altPath, content,
        title: page.title,
        description: page.description,
        type: kind === 'posts' ? 'post' : 'page',
      })));
      urls.push(`${SITE}/${outPath}`.replace(/\/index\.html$/, '/'));
    }
  }

  /* blog index per language */
  if (kind === 'posts') {
    for (const lang of LANGS) {
      const t = T[lang];
      const posts = Object.values(groups)
        .map(g => g[lang]).filter(Boolean)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      const list = posts.length
        ? `      <ul class="post-list">\n` + posts.map(p => `        <li class="post-item reveal">
          <a href="${esc(p.slug)}.html">
            <span class="post-item-date">${esc(fmtDate(p.date, lang))}</span>
            <h2>${esc(p.title)}</h2>
            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
          </a>
        </li>`).join('\n') + `\n      </ul>\n`
        : `      <p class="post-empty">${esc(t.empty)}</p>\n`;

      const outPath = lang === 'en' ? 'blog/index.html' : 'tr/blog/index.html';
      const altPath = lang === 'en' ? 'tr/blog/index.html' : 'blog/index.html';

      written.push(write(join(ROOT, outPath), layout({
        lang, outPath, altPath,
        title: t.blogTitle,
        description: t.blogLead,
        type: 'page',
        content: `      <header class="page-head">\n` +
                 `        <span class="section-label">${esc(t.blogTitle)}</span>\n` +
                 `        <h1>${esc(t.blogLead)}</h1>\n` +
                 `      </header>\n${list}`,
      })));
      urls.push(`${SITE}/${outPath}`.replace(/\/index\.html$/, '/'));
    }
  }
}

/* ── sitemap ──────────────────────────────────────────────────────────────── */

const staticUrls = [`${SITE}/`, `${SITE}/tr/`];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...urls].map(u => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
written.push(write(join(ROOT, 'sitemap.xml'), sitemap));

/* ── homepage drift check ─────────────────────────────────────────────────── */
/* index.html and tr/index.html are hand-maintained twins. Structural drift means
   someone edited one and forgot the other — cheap to detect, painful to miss. */

function structure(file) {
  if (!existsSync(file)) return null;
  const html = readFileSync(file, 'utf8');
  return {
    sections: [...html.matchAll(/<section id="([\w-]+)"/g)].map(m => m[1]).join(','),
    facades: (html.match(/class="embed-facade/g) || []).length,
    cards: (html.match(/class="project-card/g) || []).length,
    skills: (html.match(/class="skill-card/g) || []).length,
  };
}

const en = structure(join(ROOT, 'index.html'));
const tr = structure(join(ROOT, 'tr/index.html'));
const drift = [];
if (en && tr) {
  for (const k of Object.keys(en)) {
    if (String(en[k]) !== String(tr[k])) drift.push(`    ${k}: index.html=${en[k]}  tr/index.html=${tr[k]}`);
  }
}

/* ── report ───────────────────────────────────────────────────────────────── */

console.log(`\nBuilt ${written.length} files:`);
for (const f of written) console.log(`  ${f}`);

if (!tr) {
  console.log('\n  (tr/index.html not found — skipping homepage drift check)');
} else if (drift.length) {
  console.log('\n  ⚠ Homepage drift — the two homepages no longer match:');
  drift.forEach(d => console.log(d));
  console.log('    Edit both index.html and tr/index.html together.');
} else {
  console.log('\n  ✓ Homepages structurally in sync');
}
console.log('');
