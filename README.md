# Puzzler

A native jigsaw puzzle experience by Navin Hill. Start from a galactic original,
upload a photo, or describe an AI image; choose 25, 100, or 250 pieces; then drag,
snap, zoom, and pan on canvas while Navin Hill's catalog streams alongside.

Live at https://puzzler.navinhill.com

## Features

- **Carousel hero** — a full-width, endlessly wrapping coverflow of 39
  original artworks served from the `puzzler-media` R2 bucket over
  `https://puzzler-media.navinhill.com`. The selected image sits centered and
  sharp, its neighbors blur and fade outward, and a single action opens the
  selection for a piece count. Drag, swipe, tap a neighbor, use the arrow keys,
  or scroll horizontally.
- **Focused start** — choosing an artwork opens it nearly full-screen, 10% larger
  than its carousel card, with the three piece counts over the art. Hovering a
  count previews the exact jigsaw cut before the puzzle begins.
- **The collection** — every artwork below the hero, ready to open at full size
  and start at 25, 100, or 250 pieces.
- **Your own image** — drag/drop or choose a JPG, PNG, or WebP. Images are
  downscaled locally to 1600px before play; nothing is uploaded.
- **AI image generation** — describe a puzzle and let the serverless function
  generate it with Cloudflare Workers AI.
- **Jigsaw engine** — bezier tab/slot pieces, snap detection, zoom/pan, a
  toggleable board preview, and a dev-only autosolve hook for QA captures.
- **Navin Hill radio** — 43 tracks streamed from `media.navinhill.com`, in the
  order the current navinhill.com homepage presents them: Martians (14),
  Symphonies (11), Reprisals (10), Elevation (8). Includes a queue, previous /
  next, volume, and Media Session metadata.
- **Warm theme system** — warm charcoal dark, flat off-white light, and a pale
  golden-orange default accent (HSL 34 / 80% / 64%) with live hue, saturation,
  and lightness controls plus five quick picks. Preferences persist at
  `puzzler.theme.v1`.

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4 (`@tailwindcss/vite`; dark mode keyed to the app's
  `.dark-mode` class)
- Vercel serverless function (`api/generate.ts`) for AI image generation
- Cloudflare Workers AI text-to-image models
- Cloudflare R2 + custom CDN domain for the artwork gallery

## Media

The app intentionally ships no local artwork or audio files. `public/` is empty;
all artwork and music come from CDNs.

### Gallery

| Item | Value |
| --- | --- |
| R2 bucket | `puzzler-media` |
| Custom domain | `https://puzzler-media.navinhill.com` |
| Full images | `v1/full/<slug>.webp` — 1600px, quality-tuned WebP |
| Thumbnails | `v1/thumb/<slug>.webp` — 640px, quality-tuned WebP |
| Cache | `public, max-age=31536000, immutable` |
| CORS | `*` |
| Catalog | `src/data/gallery.generated.ts` (39 images) |

The 39 source images were optimized to 78 R2 objects (full + thumb). The
original files are preserved locally in `.media-source/images` (gitignored) and
are not part of the build.

### Audio

`src/data/audio.ts` is the catalog. Tracks and album covers stream from the
existing Navin Hill media CDN (`https://media.navinhill.com`), not Vercel and not
this repo. The order deliberately mirrors the homepage: Martians first, then the
Symphonies → Reprisals → Elevation album cards.

## AI — Cloudflare Workers AI

`POST /api/generate` `{ prompt }` → `{ imageB64, mimeType }`. The Cloudflare
account ID and API token stay server-side. The default model is
`@cf/black-forest-labs/flux-1-schnell`, with automatic fallback to
`@cf/bytedance/stable-diffusion-xl-lightning` and
`@cf/lykon/dreamshaper-8-lcm`. Workers AI returns base64 JSON for FLUX and raw
image bytes for the diffusion models; the function normalizes both.

`CF_IMAGE_MODELS` can override the comma-separated fallback chain. The Vite dev
server does not run the serverless function — use `vercel dev` or a deployed
environment when exercising AI generation locally.

## Environment

Copy `.env.example` to `.env`:

| Variable | Purpose |
| --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account for Workers AI |
| `CLOUDFLARE_API_TOKEN` | Token with Workers AI read/run permission (server-side only) |
| `CF_IMAGE_MODELS` | Optional comma-separated model fallback chain |

## Commands

- `bun install`
- `bun run dev` — Vite dev server on port 3000
- `bun run build` — production build
- `bun run preview` — preview the production build
- `bunx tsc --noEmit` — typecheck

## Showcase screenshots

New captures for the Navin Hill showcase live in the portfolio repo at
`assets/app-images/puzzler`, suffixed `-new` so they sit alongside the older set.
They follow the existing capture convention: 1440×900 @2x, downscaled to 1600w,
JPEG q4, plus 1200w viewport variants. Both light and dark themes are captured.

The original route set was `home`, `ai-generate-field`, and `settings-open`; the
refresh adds `collection`, `focus`, `playing`, `completed`, `finished`, and
`playlist` captures as well.

## Deployment

Vercel (framework preset: Vite). SPA rewrites are in `vercel.json`; `api/` holds
the serverless function. Gallery and audio media are external CDN assets, so the
deployment bundle contains only the app shell.
