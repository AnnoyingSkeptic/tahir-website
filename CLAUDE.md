# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page audio professional portfolio for Tahir Alaybeyi. Pure HTML/CSS/JS — no build step, no dependencies, no package manager.

## Status

Live at **tahiralaybeyi.com** — deployed via GitHub (`AnnoyingSkeptic/tahir-website`, `main` branch auto-deploys).

## Running the site

Open `index.html` directly. No server required.

To use a local dev server (optional, e.g. for iframe embeds that require HTTP):
```
npx serve .
# or
python3 -m http.server 8080
```

## Architecture

Three files, no frameworks:

- **`index.html`** — All markup. Sections in order: `#navbar`, `#hero`, `#about`, `#skills`, `#portfolio`, `#social`, `#contact`, `footer`.
- **`style.css`** — CSS custom properties defined in `:root` (colors, fonts, radius, transition). Layout uses CSS Grid + Flexbox. One responsive breakpoint at `768px`, a second at `900px` for the skills grid only.
- **`main.js`** — Three self-contained features: navbar scroll-shadow, typing animation (vanilla, no lib), scroll-reveal via `IntersectionObserver`, and a canvas particle mesh for the hero background.

## Key conventions

- Accent color is `--accent: #00d4ff`. All interactive hover states glow in this color.
- Display font is **Montserrat** (`--font-display`). Body font is **Inter** (`--font-body`). Both loaded from Google Fonts.
- Hero content is **right-aligned** (`text-align: right`, `justify-content: flex-end`). Do not center it.
- Skill cards use per-card accent colors via CSS `nth-child` + `--skill-glow` custom property. Portfolio cards alternate cyan/purple.
- `background-clip: text` on gradient spans: always add `padding-bottom: 0.12em` — tight `line-height` clips descenders otherwise.
- Scroll-reveal: add class `reveal` to any element; JS adds `visible` when it enters the viewport.
- Embedded media: YouTube uses a 16:9 padding-bottom iframe wrapper (`.project-embed`); SoundCloud uses `.project-embed.sc-embed` which overrides to a fixed 166px height.
- Hero height: `min-height: 100vh; min-height: 100svh` — the `100svh` line overrides on iOS Safari to exclude browser chrome.
- Canvas animation: pauses via `IntersectionObserver` when `#hero` is out of view — do not replace with a plain `requestAnimationFrame` loop.
- Video logo removal (hero-video-original.mp4): ffmpeg static-mask approach was tried and rejected — it blocks guitar visibility. Use DaVinci Resolve or RunwayML with motion tracking instead.

## End of every session — mandatory before closing

No exceptions. Do all three:

1. **Kanban** — move every completed item to Done, add any new Backlog items discovered. File: `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/Mind Palace/10 Projects/Tahir Website/Kanban.md`
2. **CLAUDE.md** — update conventions, open items, and any gotchas learned this session.
3. **Git** — commit and push if any site files changed.

If the user ends the session without triggering this, do it anyway in the last response.

## Key conventions (updated 2026-06-04)

- Skill icons: inline Feather SVGs (`stroke="currentColor"`), each colored via `.skill-icon { color: <card-accent>; }` per nth-child.
- Hero video: plays once, freezes on last frame. Stop button (bottom-left, `.stop-btn`) visible while playing — shrinks/fades on stop. Replay button (same slot) pops in when ended. Hero collapses to `55vh` on end via `#hero.video-ended`.
- Canvas particle mesh: boosts particle size (1.8×), opacity, and gradient vividness when `videoEnded = true`.
- Nav: TA logo removed, `justify-content: flex-end` on `.nav-inner`.
- Brush stroke accents: `::before` pseudo-elements on `#about`, `#skills`, `#portfolio`, `#contact` — narrow radial-gradient ellipses (cyan/purple, 8–13% opacity). `.container` has `position: relative; z-index: 1` to stay above them.
- `docs/` folder is gitignored (superpowers plugin scaffold).

## Open items

- Video logo removal — Calvin Klein logo in hero video. DaVinci Resolve downloaded (2026-06-04). Use motion-tracked mask/rotoscope. Static mask rejected (blocks guitar view).
- Avatar photo — replace with cleaner shot (simpler background, just Tahir + guitar). Drop on Desktop and swap `assets/avatar.jpg`.
- Exaltation portfolio card description — still placeholder copy. Ask Tahir for one line on the sound/mood.
- Spotify artist page — add links to social + contact sections once page is live.
