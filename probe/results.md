# Puzzler image-model probe — 2026-11-08

Goal: find the model(s) that best replicate the puzzler collection vibe ("vintage
galactic artwork" — 1970s sci-fi/botanical analog collage) for user-facing
generation, with neuron cost per generation confirmed against Cloudflare's
GraphQL analytics (`aiInferenceAdaptiveGroups`), not just the pricing page.

Reference images: `reference/ref-floral-511.png` (galactic-floral-00 thumb,
resized 511²) and `reference/ref-flying-511.png` (galactic-flying-01).
All generated outputs in `outputs/<model>/`, raw run log in `results.jsonl`.

## Confirmed cost per generation (GraphQL-reconciled, ±float noise)

| Model | Config | Neurons | USD | Latency |
|---|---|---:|---:|---|
| schnell | 1024², 4 steps | **172.8** | $0.0019 | 2–20 s |
| klein-4b | 1024² text | **104.2** | $0.0011 | 8–12 s |
| klein-4b | 1024² + ref | **109.6** | $0.0012 | 8 s |
| klein-4b | 1920² text | **366.3** | $0.0040 | 9 s |
| klein-9b | 1024² text | **1363.6** | $0.0150 | 2.3–2.5 s |
| klein-9b | 1024² + ref | **~1409** | $0.0155 | 2.3 s |
| klein-9b | 1792² text | **1738.6** | $0.0191 | 5.3 s |
| klein-9b | 1920² + ref | **~1866** | $0.0205 | 7 s |
| flux-2-dev | 1024², 20 steps + ref | **3373.5** | $0.0371 | 8 s |
| lucid-origin | 1024², 20 steps | **3504.0** | $0.0385 | 4.5–5 s |
| phoenix-1.0 | 1024², 25 steps | **3120.0** | $0.0343 | 3.7–22 s |

Pricing formulas confirmed empirically (tiles are fractional area, W·H/512²):

- schnell/lucid/phoenix/klein-4b: `tiles × (tile_price + steps × step_price)`
  - klein-4b has no step component (fixed 4-step schedule)
- klein-9b: `1363.64 + (W·H/1024² − 1) × 181.82` (+ ~5–15 n input-image charge)
- flux-2-dev: `output_tiles × steps × 37.5 + input_tiles × steps × 18.75`
- **Failed generations bill 0 neurons** (verified with two 500s)
- schnell self-reports `usage.neurons` in its JSON response; no other model does
- Session spend: ~17.7k n ≈ **$0.19** (account: Jamie@yrka.io `5fda12e0...`, Workers Paid)

## Style-replication findings

**Reference-image mode (`input_image_0`, must be <512²):**
- klein-9b / klein-4b / flux-2-dev all accept references (the only three).
- All kleins **clone the reference composition** — style fidelity A+, novelty D.
  Great for "more of this collection", wrong tool for "new image, same vibes".
- **flux-2-dev follows the new-content prompt best** (actual red poppies, new
  composition, vintage analog vibe) — the premium ref model, at ~8× klein-9b cost.

**Text-only mode (style via prompt):**
- **klein-9b is the winner**: best texture/vibe fidelity of the text-only group,
  fastest premium latency (2–7 s), genuinely novel compositions.
- klein-4b is the budget workhorse: good vibe, slower, ~13× cheaper than 9b.
- phoenix-1.0: photographic, taped-corner vintage collage — closest single
  text-only match to the floral pieces; no reference support on CF.
- lucid-origin: solid, leans illustrated; weakest "analog photo" feel.
- schnell: flat/illustrative, least faithful to the vintage-photo vibe.
- Prompt lesson: models add gibberish title text if the prompt says "cover",
  "poster", "album art". Always append "no text no lettering" (or avoid
  print-medium nouns) for puzzle art.

## Known quirks

- klein-9b text-only at exactly 1920×1920 → deterministic `AiError 3043` (500).
  Reference runs at 1920 are fine; 1792² works. Handler clamps klein-9b to 1792.
- FLUX.2 trio needs multipart form input (JSON body fails), even prompt-only.
- phoenix-1.0 returns raw JPEG bytes, not JSON.
- lucid-origin/phoenix schemas have no image-input field on CF — text-only.

## Style-off matrix (2026-11-08, round 2)

One prompt, all six models, text-only, 1024², two unseeded (random-seed) runs each.
Prompts P1 (botanical/cosmic lilies) and P2 (salmon-planet sci-fi collage) — the two
best performers from round 1. Visual grid: `probe/comparison.html`. Outputs:
`probe/outputs/style-off/<model>/p{1,2}-{a,b}`.

23/24 succeeded (one klein-9b 500 at 1024² — the flakiness is availability, not
size; billed 0 n, retry succeeded). Confirmed per-gen costs held exactly in
GraphQL: schnell 4×172.8, klein-4b 4×104.2, klein-9b 1,363.6 each, lucid 3,504,
phoenix 3,120, dev 3,000 @20 steps. Matrix total ≈ **43,695 n ≈ $0.48**.

Verdicts (vibe fidelity to the vintage-analog collection):

1. **phoenix-1.0** — best single frames of the session (P2 pair: 70s paperback
   duotone, ringed planet, palm silhouettes). Photographic. Watch: sneaks faux
   lettering onto objects despite "no text" (P2-b saucer).
2. **klein-9b / flux-2-dev (tie)** — 9b: richest skies/texture, fastest (2 s).
   dev: film-frame borders + light leaks, great prompt obedience. Both ~30× 4b.
3. **klein-4b** — 90% of 9b's look at 7% of its price. Light leaks, creases,
   aged borders all present. The default pick, unchanged.
4. **lucid-origin** — signature torn-paper collage borders; leans illustrated.
5. **schnell** — flat illustration; "vintage" painted on. Cheap filler only.

## Recommendation for the app

1. **Default (public demo traffic): klein-4b** — 104 n @ 1024² / 366 n @ 1920²,
   reliably on-vibe, cheap enough that the rate limit is a formality.
2. **Premium option: klein-9b** — visibly better texture at ~13× cost; fine
   gated behind the rate limiter.
3. **"More like this" feature (reference mode): klein-9b** with a downscaled
   (<512²) reference; switch to flux-2-dev if prompt-divergence matters more
   than collection consistency.
4. Keep schnell in the legacy fallback chain; skip lucid/phoenix for now
   (~3.1–3.5 k n at 1MP, no ref support, no cheaper step economy).

## Handler wiring (api/generate.ts)

- `POST /api/generate` body: `prompt`, optional `model` (catalog key above),
  `width`/`height` (per-model clamped), `steps`, `guidance`, `seed`,
  `referenceImage` (data URL or base64, client must downscale to <512²).
- No `model` → legacy chain (schnell → sdxl-lightning → dreamshaper), unchanged.
- In-memory rate limit: 8/hour per IP + 200/day per instance (deterrent-grade;
  cold starts reset it). 429 + Retry-After; frontend already surfaces the error.
- Upstream latency/neurons logged per call for dashboard reconciliation.
