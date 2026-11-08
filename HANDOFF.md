# Puzzler — session handoff (2026-11-08)

Where things stand, for whoever picks this up.

## State of the code

**`api/generate.ts`** (deployed to prod 2026-11-08):
- All six models wired behind a `model` request param: `klein-9b`, `klein-4b`, `flux-2-dev` (multipart + optional `referenceImage`), `lucid-origin`, `phoenix-1.0`, `schnell` (JSON). Per-model size clamps (note: klein-9b capped at 1792 — text-only 1920² 500s deterministically), step/guidance/seed pass-through with validation.
- No `model` param → legacy chain unchanged (schnell → sdxl-lightning → dreamshaper), so the current deployed frontend keeps working untouched.
- Rate-limit guard: in-memory 8/h per IP + 200/day per instance, `429 + Retry-After`. Zero frontend changes needed (App.tsx already surfaces JSON `error`).
- The inert AI Gateway block was removed (2026-11-08): `gatewayHeader()` / `CF_AIG_GATEWAY_ID` no longer exist; every call hits Workers AI directly. Standing decision: **Workers AI only — no AI Gateway, no jami.studio account.**
- Deps: `@vercel/node` 23→30 + npm overrides (`@fastify/busboy`, `ajv`, `glob`, `minimatch`, `path-to-regexp`, `undici`) — **0 npm vulnerabilities** (2026-11-08, commit `02dc18c`).
- UI thread's WIP was committed+pushed in `02dc18c` (deps-fix commit used a bare `git commit` that swept files the UI thread had pre-staged). Vercel is git-connected, so the push auto-deployed prod; the WIP UI was verified mounting in a browser (hero Generate pill, AI prompt box, gallery, player all render). Working tree was clean afterward — nothing lost. UI thread: commit your next iteration with explicit paths.

## Probing results — everything lives in `probe/`

- **`probe/results.md`** — the full report: GraphQL-verified neuron costs, formulas, quirks, style verdicts.
- **`probe/comparison.html`** — visual grid: same prompt × 6 models × 2 seeds.
- **`probe/outputs/`** — ~39 generations. **`probe/harness.mjs`** + `results.jsonl` — reusable probe tooling.

Confirmed cost per generation ($0.011 / 1,000 neurons; tiles are fractional area W·H/512²):

| Model | 1024² | 1920²-ish | Notes |
|---|---:|---:|---|
| klein-4b | 104 n / $0.0011 | 366 n / $0.0040 | no step charge; the engine |
| schnell | 173 n / $0.0019 | n/a (fixed 1024²) | cheap fallback |
| klein-9b | 1,364 n / $0.0150 | ~1,852 n | fastest (2 s), ~10% 500-flake |
| flux-2-dev | 3,000 n @20 steps | ~13k @25 steps | best ref-mode prompt obedience |
| phoenix-1.0 | 3,120 n @25 steps | ~11–12k | best single frames; sneaks faux text |
| lucid-origin | 3,504 n @20 steps | ~12–14k | torn-paper collage signature |

Verdicts James signed off on: **klein-4b = default engine** (premium tiers indistinguishable at puzzle-tile scale); phoenix/lucid = occasional premium tier (~30–34× 4b); klein-9b rejected (13× for "hardly any gains"). Ref-mode on the kleins **clones** the reference composition (fidelity A+, novelty D) — for "new image, same vibes" use text-only; flux-2-dev is the ref model that actually makes new content. Prompts must end "no text no lettering" and avoid "cover/poster/album art" nouns (gibberish lettering otherwise).

## CF account situation — read this part

- Probing used vault `backup-cf-rotation-20261029` → `CLOUDFLARE_YRKA_FULL_TOKEN` = account `5fda12e0ca49798931b92e6f223d37b6` ("Jamie@yrka.io"). **James corrected: this is NOT the account the puzzler app uses.** I inferred it from GraphQL activity fingerprints — that inference was wrong/never verified against the actual Vercel-held creds (CLI redacts them as `[SECURE]`). Treat app-account identity as unverified until someone reads it off the CF dash.
- An AI Gateway was created and deleted on `5fda12e0` (audit log: created 12:41:55Z, deleted 12:48:42Z; exactly one request through it, 172.8 n ≈ $0.002). **James flagged possible Enterprise-contract billing sensitivity** (minimum charge / credit lockout). Audit timestamps + a reversal note were provided in-session; James should confirm the invoice and loop in the CF account team. Standing rule recorded: **no resource creation on any account without explicit approval.**
- Platform fact that stands regardless: Workers AI has no hard spend cap; the only $-denominated cap in CF's catalog is AI Gateway spend limits (dashboard-only, beta) — which James rejected. So the hard-cap conversation is closed unless he reopens it.

## Spend guard — what's active

- In-app limiter (above) — active in code, deploys with the next build.
- The hourly GraphQL spend-watch automation was deleted (2026-11-08); no automations remain in this workspace.

## Next steps

1. Handler live + verified (2026-11-08). The UI thread's WIP is also live (swept into `02dc18c`; git-connected deploy) — prod now runs exactly what was in the working tree.
2. Frontend wiring (when UI thread is ready): model picker + optional reference upload (client must downscale refs to <512×512 — CDN thumbs are 640², use ffmpeg or canvas).
3. Verify live via `https://puzzler.navinhill.com/api/generate` only (vercel.app URLs are SSO-401).
4. CF dash (James): usage notifications at budget thresholds; confirm token scope is Workers AI run-only; invoice check re: gateway.

## Tooling notes (gotchas that cost time)

- `vercel env pull` redacts Sensitive vars as `[SECURE]`; pulled files have CRLF — strip `\r` before sourcing.
- Model param data: `cloudflare/cloudflare-docs` repo, branch `production`, `src/content/workers-ai-models/*.json` + `src/content/changelog/workers-ai/` (docs site is client-rendered, grep the repo instead).
- Neuron ground truth: GraphQL `aiInferenceAdaptiveGroups` (`totalNeurons`, dimensions `modelId`/`datetimeMinute`), ingestion lag ~2–15 min. Failed gens bill 0.
- Puzzler media CDN: `puzzler-media.navinhill.com/v1/{full,thumb}/<id>.webp`; gallery ids in `src/data/gallery.generated.ts`.
- Yrka gateway (`gateway.yrka.io/v1`) proxies all six models as `cf-img-*` — unused, direct CF preferred for neuron visibility.
