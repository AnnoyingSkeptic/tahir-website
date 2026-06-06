# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page audio professional portfolio for Tahir Alaybeyi. Pure HTML/CSS/JS — no build step, no dependencies, no package manager.

## Status

Live at **tahiralaybeyi.com** — deployed via **GitHub Pages** (`AnnoyingSkeptic/tahir-website`, `main` branch auto-deploys via Pages).

DNS is managed through **Netlify DNS** (nameservers: `dns*.p03.nsone.net`). A records point to GitHub Pages IPs. A `CNAME` file in the repo root sets the custom domain — do not delete it.

## Running the site

Open `index.html` directly in a browser. No server required.

Optional local dev server (for iframe embeds that require HTTP):
```bash
python3 -m http.server 8080
# visit http://localhost:8080
```

## Architecture

Three files, no frameworks:

- **`index.html`** — All markup. Sections in order: `#navbar`, `#hero`, `#about`, `#skills`, `#portfolio`, `#social`, `#contact`, `footer`. Canvas element is at the top of `<body>` (before navbar), not inside `#hero`.
- **`style.css`** — CSS custom properties in `:root` (colors, fonts, radius, transition). Layout uses CSS Grid + Flexbox. Breakpoints: `900px` (skills grid), `768px` (main responsive), `480px` (mobile hero centering).
- **`main.js`** — Features: navbar scroll-shadow, typing animation, scroll-reveal via `IntersectionObserver`, canvas particle mesh + shooting star system.

## Key conventions

- Accent color: `--accent: #00d4ff`. All interactive hover states glow in this color.
- Display font: **Montserrat** (`--font-display`). Body: **Inter** (`--font-body`). Both from Google Fonts.
- Hero is **right-aligned on desktop** (`justify-content: flex-start`, `text-align: left`). On mobile (`<480px`) it switches to `justify-content: center`, `text-align: center`.
- Skill cards use per-card accent colors via `nth-child` + `--skill-glow`. Portfolio cards alternate cyan/purple.
- `background-clip: text` on gradient spans: always add `padding-bottom: 0.12em` — tight `line-height` clips descenders.
- Scroll-reveal: add class `reveal` to any element; JS adds `visible` on viewport entry.
- Embedded media: YouTube uses 16:9 padding-bottom iframe wrapper (`.project-embed`); SoundCloud uses `.project-embed.sc-embed` (fixed 166px height).
- Hero height: `min-height: 100vh; min-height: 100svh` — `100svh` overrides on iOS Safari to exclude browser chrome.
- Skill icons: inline Feather SVGs (`stroke="currentColor"`), colored via `.skill-icon { color: <card-accent>; }` per nth-child.
- Nav: no logo, `justify-content: flex-end` on `.nav-inner`.
- Brush stroke accents: `::before` pseudo-elements on `#about`, `#skills`, `#portfolio`, `#contact` — narrow radial-gradient ellipses (cyan/purple, 8–13% opacity). `.container` has `position: relative; z-index: 1` to stay above them.
- `docs/` folder is gitignored (superpowers plugin scaffold).

## Canvas system

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

- Video logo removal — Calvin Klein logo in hero video. DaVinci Resolve downloaded (2026-06-04). Motion-tracked mask/rotoscope approach.
- Avatar photo — replace with cleaner shot (simpler background, just Tahir + guitar). Drop on Desktop and swap `assets/avatar.jpg`.
- Exaltation portfolio card — description is placeholder copy. Need one line on sound/mood.
- Spotify artist page — add links to social + contact sections once page is live.
- Cross-browser visual check — code reviewed; real-device spot-check on Safari + Chrome still pending.
