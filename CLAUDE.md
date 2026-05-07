# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Single-page audio professional portfolio for Tahir Alaybeyi. Pure HTML/CSS/JS — no build step, no dependencies, no package manager.

## Running the site

Open `index.html` directly in a browser. No server required.

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
- Scroll-reveal: add class `reveal` to any element; JS adds `visible` when it enters the viewport.
- Embedded media: YouTube uses a 16:9 padding-bottom iframe wrapper (`.project-embed`); SoundCloud uses `.project-embed.sc-embed` which overrides to a fixed 166px height.

## Placeholders to replace

| Placeholder | Location | What to replace with |
|---|---|---|
| `YOUR_HANDLE` | `index.html` (×2) | Instagram username |
| `YOUR_CHANNEL` | `index.html` (×2) | YouTube channel handle |
| `YOUR_PROFILE` | `index.html` (×2) | SoundCloud profile slug |
| `YOUR_ID` | `index.html` (×2) | Spotify artist ID |
| `dQw4w9WgXcQ` | `index.html` (×2) | Real YouTube video IDs |
| SoundCloud embed URLs | `index.html` (×2) | Real SoundCloud track URLs |
| `[Your City]` | `index.html` | City name in About bio |
| `TA` avatar div | `index.html` | `<img>` tag with real photo |
