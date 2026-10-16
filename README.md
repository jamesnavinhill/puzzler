# Puzzler

A web-based jigsaw puzzle game: drop in any photo (or generate one with AI),
choose 25/100/250 pieces, and play with drag, snap, zoom, and pan on canvas.

Live at https://puzzler.navinhill.com

## Features

- **Custom images** — upload a photo (client-side downscale to 1600px) or use the demo landscape
- **AI image generation** — describe a puzzle ("a colorful mosaic tile pattern") and the
  serverless function generates it via the Agency gateway's free image models
- **Jigsaw engine** — bezier tab/slot piece generation, snap detection, zoom/pan
- **Ambient audio** — local lofi track (Pixabay Content License), volume control
- **Theme customizer** — hue/saturation accent + dark/light mode (CSS variables)

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind CSS 4 (`@tailwindcss/vite` — dark mode keyed to the app's `.dark-mode` class)
- Vercel serverless function (`api/generate.ts`) for AI image generation

## AI — Agency gateway

`POST /api/generate` `{ prompt }` → `{ imageB64 }`. The gateway key stays
server-side; requests carry an `x-agency-surface: puzzler` header. Image model
is env-configurable via `YRKA_IMAGE_MODEL` (default `cf-img-flux-1-schnell`,
a cheap/effective free-tier model).

## Environment

Copy `.env.example` to `.env`:

| Variable | Purpose |
| --- | --- |
| `YRKA_GATEWAY_API_KEY` | Agency gateway key (server-side only, `/api/generate`) |
| `YRKA_GATEWAY_BASE_URL` | Optional gateway override |
| `YRKA_IMAGE_MODEL` | Optional image model override |

## Commands

- `bun install`
- `bun run dev` — dev server (UI; `/api/generate` needs `vercel dev` or a deployed env)
- `bun run build` — production build

## Deployment

Vercel (framework preset: Vite). SPA rewrites in `vercel.json`; `api/` holds
the serverless function. The deployed demo runs without the gateway key until
credentials are pushed to Vercel env vars — the UI surfaces a clear
"not configured" error until then.
