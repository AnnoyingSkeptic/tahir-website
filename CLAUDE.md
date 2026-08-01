# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Bilingual (EN/TR) audio professional portfolio for Tahir Alaybeyi, plus a blog and legal pages. The **shipped site** is pure HTML/CSS/JS — no framework, no runtime dependencies, no package manager. Blog and legal pages are generated from markdown by a hand-run script; the generated `.html` is committed and served as-is.

## Language structure

| | English | Turkish |
|---|---|---|
| Homepage | `index.html` | `tr/index.html` |
| Blog | `blog/` | `tr/blog/` |
| Privacy | `privacy.html` | `tr/gizlilik.html` |
| Cookies | `cookies.html` | `tr/cerezler.html` |

- The two homepages are **hand-maintained twins**. Edit both together. `tools/build.mjs` runs a structural drift check (section ids, facade/card/skill counts) and warns when they diverge — heed it.
- Every page carries `hreflang` alternates for `en`, `tr`, and `x-default` (English).
- The typing animation reads its roles from `data-roles` on `#typedRole` (pipe-separated), so `main.js` is shared by both homepages. Don't hardcode roles back into the JS.
- Subpages load `page.js`, **not** `main.js` — `main.js` assumes the hero video and canvas exist and throws without them.

## Content pipeline

Markdown in `content/` → static HTML at the repo root:

```bash
node tools/build.mjs      # writes blog/, tr/blog/, legal pages, sitemap.xml
```

- `content/posts/{en,tr}/*.md` → `blog/<slug>.html`, `tr/blog/<slug>.html`
- `content/legal/{en,tr}/*.md` → `<slug>.html`, `tr/<slug>.html`
- **Translation pairing is by FILENAME**, not slug. `legal/en/privacy.md` and `legal/tr/privacy.md` are the same page; the `slug:` front-matter field sets the URL, so the Turkish one publishes to `/tr/gizlilik.html`. A file with no counterpart builds anyway and logs a warning.
- Front matter: `title`, `slug`, `date` (ISO), `description`.
- Run the script and **commit the generated HTML** — GitHub Pages does no building.
- `marked` lives in `tools/` (gitignored), so the site itself stays dependency-free.

## Status

Live at **tahiralaybeyi.com** — deployed via **GitHub Pages** (`AnnoyingSkeptic/tahir-website`, `main` branch auto-deploys via Pages).

DNS is managed through **Netlify DNS** (nameservers: `dns*.p03.nsone.net`). A records point to GitHub Pages IPs. A `CNAME` file in the repo root sets the custom domain — do not delete it.

- After enabling Pages via API or setting a custom domain, GitHub auto-commits a `CNAME` file. Run `git pull --rebase` before the next push or it will be rejected.

## Running the site

**Always preview via a local server, not `file://`.** Opening `index.html` directly works for a glance, but `file://` aggressively caches `main.js`/`style.css`, so visual changes (canvas particles, meteors, CSS tweaks) can look *reverted when they actually shipped*. This burned a whole session once. Serve it and hard-refresh instead:

```bash
python3 -m http.server 8081 --bind 127.0.0.1
# visit http://127.0.0.1:8081 — Cmd+Shift+R to bypass cache
```

**Do not use port 8080 on this machine.** SpoofDPI (the LaunchAgent that works around Turkey's ISP blocking) listens on `127.0.0.1:8080`. Since `localhost` resolves to `127.0.0.1`, SpoofDPI wins the race and you get a 200 back from the *proxy*, not from your site — which looks exactly like a stale cache or a broken build. A `python3 -m http.server 8080` alongside it binds `*:8080` (IPv6 wildcard) and appears to start fine, so nothing errors; you just silently preview the wrong thing.

Bind explicitly to `127.0.0.1` and pick a port other than 8080. Sanity-check what you're actually served before debugging anything visual:

```bash
curl -s --noproxy '*' http://127.0.0.1:8081/ | grep -c 'embed-facade'   # expect 5
```

Also: always `--bind 127.0.0.1`. A bare `python3 -m http.server` binds all interfaces, and if it's started from the wrong directory it will happily serve `$HOME` to the local network.

This also matches how GitHub Pages serves the site, so previews stay accurate. iframe embeds (YouTube/SoundCloud) also require HTTP, not `file://`.

### Visual smoke test (Playwright screenshots)

`tools/preview.mjs` drives bundled Chromium to screenshot the site at desktop (1440) and mobile (390), scrolling each section so reveals fire. Dev-only — `tools/` is gitignored so the site stays dependency-free.

```bash
cd tools && npm install        # one-time; Chromium is already cached system-wide
node preview.mjs               # live site → /tmp/{desktop,mobile}-{hero,about,skills,portfolio,contact}.png
node preview.mjs http://localhost:8080   # local dev server
```

Gotchas (learned the hard way — don't re-derive):
- Use `waitUntil: 'load'`, **not `'networkidle'`** — the autoplay hero video keeps the network busy forever, so `networkidle` always times out.
- Scroll-reveal sections (`.reveal` → `.visible` via `IntersectionObserver`) render blank in a plain `fullPage` screenshot because the observer never fires off-screen. `preview.mjs` scrolls through the page first to trigger them; a raw `fullPage` shot will look like the page is empty below the hero (it isn't).
- The Playwright **MCP** is pinned to the `chrome` channel (not installed). The script bypasses the MCP and uses the cached bundled Chromium directly, so it works without Chrome or a Claude Code restart.

## Architecture

Three files, no frameworks:

- **`index.html`** — All markup. Sections in order: `#navbar`, `#hero`, `#about`, `#skills`, `#portfolio`, `#contact`, `footer`. Canvas element is at the top of `<body>` (before navbar), not inside `#hero`. The `#social` section was removed — social links now live inside `#contact` as `.contact-social` icon circles below the email CTA, with a `.contact-find-label` text divider.
- **`style.css`** — CSS custom properties in `:root` (colors, fonts, radius, transition). Layout uses CSS Grid + Flexbox. Breakpoints: `900px` (skills grid), `768px` (main responsive), `480px` (mobile hero centering).
- **`main.js`** — Homepage only: hero video controls, typing animation, navbar scroll, scroll-reveal, embed facades.
- **`canvas.js`** — Particle mesh + shooting stars. Loaded by *every* page, before `main.js` / `page.js`. Self-guards on a missing canvas element.
- **`page.js`** — Subpages only: navbar scroll, mobile menu, scroll-reveal. No hero/video assumptions.

## Key conventions

- Accent color: `--accent: #00d4ff`. All interactive hover states glow in this color.
- Display font: **Montserrat** (`--font-display`). Body: **Inter** (`--font-body`). Both **self-hosted** in `assets/fonts/` — never reintroduce a `fonts.googleapis.com` link (see Privacy below).
- Hero is **right-aligned on desktop** (`justify-content: flex-start`, `text-align: left`). On mobile (`<480px`) it switches to `justify-content: center`, `text-align: center`.
- Skill cards use per-card accent colors via `nth-child` + `--skill-glow`. Portfolio cards alternate cyan/purple.
- `background-clip: text` on gradient spans: always add `padding-bottom: 0.12em` — tight `line-height` clips descenders.
- Scroll-reveal: add class `reveal` to any element; JS adds `visible` on viewport entry.
- Embedded media: **click-to-load facades, never bare iframes.** `.embed-facade` holds a locally-hosted poster (`assets/thumbs/<id>.jpg`) or a CSS waveform, a play button, and a consent note. `main.js` swaps in the real iframe on click. YouTube uses 16:9 padding-bottom wrapper (`.project-embed`); SoundCloud uses `.project-embed.sc-embed` (fixed 166px height).
- Hero height: `min-height: 100vh; min-height: 100svh` — `100svh` overrides on iOS Safari to exclude browser chrome.
- Skill icons: inline Feather SVGs (`stroke="currentColor"`), colored via `.skill-icon { color: <card-accent>; }` per nth-child.
- Nav: no logo, `justify-content: flex-end` on `.nav-inner`.
- Brush stroke accents: `::before` pseudo-elements on `#about`, `#skills`, `#portfolio`, `#contact` — narrow radial-gradient ellipses (cyan/purple, 8–13% opacity). `.container` has `position: relative; z-index: 1` to stay above them.
- `docs/` folder is gitignored (superpowers plugin scaffold).

## Privacy — the site's central technical constraint

**A cold page load must contact zero third parties and set zero cookies.** The published Cookie Policy states this outright, so breaking it makes the site's own legal text false. This is why there is no cookie banner: there is nothing to consent to.

Rules that follow from it — do not quietly undo any of these:

- **No third-party asset URLs.** No CDN fonts, scripts, stylesheets, or hotlinked images. Everything ships from the repo. Google Fonts hotlinking specifically leaks visitor IPs to Google (LG München I, 3 O 17493/20).
- **No embed loads before a click.** New video/audio goes in as a facade with a locally-downloaded poster. YouTube uses `youtube-nocookie.com`, injected on click only.
- **No analytics, no tag managers, no pixels, no web fonts by URL.**
- **No contact form.** The `mailto:` link means the site never receives or stores form data.
- **No comments on the blog.** User-generated content would make the site a *yer sağlayıcı* under Turkish Law 5651 and pull in a whole separate obligation set.
- **No newsletter signup** without a deliberate decision first — commercial email in Turkey requires İYS registration plus separate explicit consent.

Verify before every deploy:

```bash
python3 -m http.server 8080          # repo root
node tools/privacy-check.mjs         # from repo root; exits non-zero on violation
```

It asserts zero foreign requests, zero cookies, and zero console errors on all ten pages, then confirms the facades still swap in real players on click and that Turkish glyphs render (latin-ext subset loaded).

### Legal documents

`content/legal/` is the source of truth; the `.html` files are generated. If you edit them:

- **Keep the privacy notice and any consent text as separate documents.** Turkish DPA principle decision 2026/347 (18.02.2026, Official Gazette 24.03.2026) makes merging them unlawful. Currently there is no consent document at all, which is deliberate.
- The privacy notice must retain KVKK Art. 10's mandatory elements and the Art. 11 rights list.
- Cross-border transfer wording reflects KVKK Art. 9 as amended effective 01.06.2024 (transfers are incidental, on the visitor's own initiative).
- Not reviewed by a lawyer. Treat as a good-faith baseline, not settled advice.

## Visual / animation changes — workflow

Canvas + animation tweaks caused the most rework (particle mesh, meteors). Before editing:

- Restate the target as **explicit per-state behavior** ("video playing = X; video stopped = Y") and confirm it before touching `main.js`.
- Change **one state/variable at a time**, serve locally, and let Tahir verify each step before stacking the next change — don't batch several animation edits into one revert-prone pass.
- Don't infer intent from a vague adjective ("subtle", "cooler"); ask for the concrete value (opacity, count, speed) or propose one and confirm.

## Canvas system

Lives in **`canvas.js`**, shared by every page (homepages and subpages). It is *not* in `main.js` — don't move it back, or the two page types will diverge.

Tuned per page via data attributes on the canvas element:

| Attribute | Default | Homepages | Subpages |
|---|---|---|---|
| `data-density` | `1` | omitted | `0.7` |
| `data-meteors` | `6` | omitted | `4` |
| `data-alpha` | `1` | omitted | `0.8` |
| `data-mesh` | fixed 180px | omitted | `responsive` |

The homepages omit all four **on purpose** — they run at the original values, so their appearance is unchanged from before the extraction. Subpages run the same system thinned out so long-form text stays readable. Subpage values are Tahir's call (raised from 0.45/3/0.7 on 2026-08-01); treat them as a preference, not a tuning target.

`data-mesh="responsive"` caps the connection radius at 30% of viewport width. Without it the 180px radius spans half a 375px phone screen and the mesh reads as clutter — fine on desktop, bad on mobile. Only subpages set it; adding it to the homepages would change their mobile look.

- `<canvas id="heroCanvas">` sits at `<body>` level, `position: fixed`, `z-index: 0`. All sections are `background: transparent; z-index: 1` so the canvas shows through the full page.
- Two systems: **particle mesh** (200 twinkling dots with connecting lines, white→cyan color range) + **shooting stars** (6 meteors, random 360° directions, slow drift).
- Meteor shape: tapered wedge — invisible tail for 70% of length, bright head spike at the tip with a white crystalline core line and radial glow.
- Animation pauses via **Page Visibility API** (`visibilitychange`) when the tab is hidden. Does NOT use `IntersectionObserver`.
- Respawn check covers all 4 edges: `m.x > W + m.len || m.y > H + m.len || m.x < -m.len || m.y < -m.len`.
- `resize()` uses `window.innerWidth/Height`, not `offsetWidth/Height`.

## Hero video behaviour

- Autoplays muted on load, plays once (no loop).
- Stop button (`.stop-btn`, bottom-left) visible while playing — click pauses and collapses hero.
- Hero collapses to `62vh` on stop via `#hero.video-ended`.
- Replay button pops in at the same slot when stopped.
- Video logo removal (hero-video-original.mp4): static ffmpeg mask rejected (blocks guitar). Use DaVinci Resolve or RunwayML with motion-tracked rotoscope.

## End of every session — mandatory

No exceptions:

1. **Kanban** — move completed items to Done, add new Backlog items. File: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Mind Palace/10 Projects/Tahir Website/Kanban.md`
2. **CLAUDE.md** — update conventions, open items, gotchas.
3. **Git** — commit and push any changed site files.

## Open items

- **Legal texts unreviewed by a lawyer** — written 2026-08-01 against KVKK Art. 10/11, the Çerez Rehberi, and decision 2026/347. Whether a solo freelancer portfolio is a full *veri sorumlusu* is genuinely arguable; the technical measures stand regardless.
- **No physical address in the privacy notice** — deliberately omitted (home address on a public page). Conventionally expected in a Turkish aydınlatma metni; email-only is the trade-off taken.
- **Blog has one post.** The system works; the content pipeline is the bottleneck, not the tooling.
- Video logo removal — Calvin Klein logo in hero video. DaVinci Resolve downloaded (2026-06-04). Motion-tracked mask/rotoscope approach.
- Avatar photo — replace with cleaner shot (simpler background, just Tahir + guitar). Drop on Desktop and swap `assets/avatar.jpg`.
- Exaltation portfolio card — description is placeholder copy. Need one line on sound/mood.
- Spotify artist page — add links to social + contact sections once page is live.
- Cross-browser visual check — code reviewed; real-device spot-check on Safari + Chrome still pending.
