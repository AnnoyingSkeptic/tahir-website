# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page audio professional portfolio for Tahir Alaybeyi. Pure HTML/CSS/JS — no build step, no dependencies, no package manager.

## Status

Live at **tahiralaybeyi.com** — deployed via **GitHub Pages** (`AnnoyingSkeptic/tahir-website`, `main` branch auto-deploys via Pages).

DNS is managed through **Netlify DNS** (nameservers: `dns*.p03.nsone.net`). A records point to GitHub Pages IPs. A `CNAME` file in the repo root sets the custom domain — do not delete it.

- After enabling Pages via API or setting a custom domain, GitHub auto-commits a `CNAME` file. Run `git pull --rebase` before the next push or it will be rejected.

## Running the site

**Always preview via a local server, not `file://`.** Opening `index.html` directly works for a glance, but `file://` aggressively caches `main.js`/`style.css`, so visual changes (canvas particles, meteors, CSS tweaks) can look *reverted when they actually shipped*. This burned a whole session once. Serve it and hard-refresh instead:

```bash
python3 -m http.server 8080
# visit http://localhost:8080 — Cmd+Shift+R to bypass cache
```

This also matches how GitHub Pages serves the site, so previews stay accurate. iframe embeds (YouTube/SoundCloud) also require HTTP, not `file://`.

## Architecture

Three files, no frameworks:

- **`index.html`** — All markup. Sections in order: `#navbar`, `#hero`, `#about`, `#skills`, `#portfolio`, `#contact`, `footer`. Canvas element is at the top of `<body>` (before navbar), not inside `#hero`. The `#social` section was removed — social links now live inside `#contact` as `.contact-social` icon circles below the email CTA, with a `.contact-find-label` text divider.
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

## Visual / animation changes — workflow

Canvas + animation tweaks caused the most rework (particle mesh, meteors). Before editing:

- Restate the target as **explicit per-state behavior** ("video playing = X; video stopped = Y") and confirm it before touching `main.js`.
- Change **one state/variable at a time**, serve locally, and let Tahir verify each step before stacking the next change — don't batch several animation edits into one revert-prone pass.
- Don't infer intent from a vague adjective ("subtle", "cooler"); ask for the concrete value (opacity, count, speed) or propose one and confirm.

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
