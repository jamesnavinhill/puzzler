import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * AI image generation for puzzle creation.
 *
 * Two paths:
 *  - Default (no `model` in the request): the legacy free-tier fallback chain
 *    (flux-1-schnell -> sdxl-lightning -> dreamshaper-8-lcm).
 *  - Explicit `model`: one of the curated Workers AI models in MODEL_CATALOG.
 *    The FLUX.2 family takes multipart form input and optional reference
 *    images (`referenceImage`, a data URL or bare base64, must be < 512x512 —
 *    the client is responsible for downscaling). lucid-origin and phoenix-1.0
 *    are text-only JSON APIs; phoenix returns raw JPEG bytes.
 *
 * Every upstream call is logged with its model, latency, and any reported
 * neuron usage so spend can be reconciled against the Cloudflare dashboard.
 *
 * A simple in-memory rate limit guards the public endpoint. It is per serverless
 * instance: cold starts reset it and warm instances each keep their own budget,
 * so treat it as a deterrent, not an airtight quota.
 */

interface ModelSpec {
  id: string;
  /** multipart = FLUX.2 family (form fields, optional reference images); json = prompt body */
  shape: 'multipart' | 'json';
  /** square side limits where width/height are settable */
  minSide?: number;
  maxSide?: number;
  /** fixed output side (schnell generates 1024x1024 regardless) */
  fixedSide?: number;
  steps?: { min: number; max: number; default: number };
  /** phoenix streams raw image bytes instead of JSON */
  binaryResponse?: boolean;
  /** klein-9b/4b are distilled to a fixed 4-step schedule */
  fixedSteps?: number;
}

const MODEL_CATALOG: Record<string, ModelSpec> = {
  'klein-9b': {
    id: '@cf/black-forest-labs/flux-2-klein-9b',
    shape: 'multipart',
    minSide: 256,
    // text-only generations at exactly 1920x1920 deterministically fail with
    // AiError 3043 (reference-image runs at 1920 are fine) — 1792 is the safe
    // ceiling until Cloudflare fixes it.
    maxSide: 1792,
    fixedSteps: 4,
  },
  'klein-4b': {
    id: '@cf/black-forest-labs/flux-2-klein-4b',
    shape: 'multipart',
    minSide: 256,
    maxSide: 1920,
    fixedSteps: 4,
  },
  'flux-2-dev': {
    id: '@cf/black-forest-labs/flux-2-dev',
    shape: 'multipart',
    minSide: 256,
    maxSide: 1920,
    steps: { min: 1, max: 50, default: 25 },
  },
  'lucid-origin': {
    id: '@cf/leonardo/lucid-origin',
    shape: 'json',
    minSide: 256,
    maxSide: 2500,
    steps: { min: 1, max: 40, default: 20 },
  },
  'phoenix-1.0': {
    id: '@cf/leonardo/phoenix-1.0',
    shape: 'json',
    minSide: 256,
    maxSide: 2048,
    steps: { min: 1, max: 50, default: 25 },
    binaryResponse: true,
  },
  schnell: {
    id: '@cf/black-forest-labs/flux-1-schnell',
    shape: 'json',
    fixedSide: 1024,
    steps: { min: 1, max: 8, default: 4 },
  },
};

/** Used when the request does not name a model. */
const DEFAULT_MODELS = [
  '@cf/black-forest-labs/flux-1-schnell',
  '@cf/bytedance/stable-diffusion-xl-lightning',
  '@cf/lykon/dreamshaper-8-lcm',
];

export const maxDuration = 60;

interface GeneratedImage {
  b64: string;
  mimeType: string;
  neurons?: number;
}

/** Workers AI content-type headers do not always match the encoded bytes. */
const sniffMimeType = (buffer: Buffer): string => {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return 'image/png';
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }

  return 'image/jpeg';
};

const configuredModels = () =>
  (process.env.CF_IMAGE_MODELS ?? '')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

// --- rate limiting -----------------------------------------------------------

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_PER_IP = 8;
const DAILY_MAX = 200;

const ipWindows = new Map<string, { count: number; start: number }>();
let dailyCount = { day: '', count: 0 };

const clientIp = (req: VercelRequest): string | null => {
  const forwarded = req.headers['x-forwarded-for'];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
  return first?.trim() || req.headers['x-real-ip']?.toString() || null;
};

const rateLimited = (req: VercelRequest): { limited: boolean; retryAfterSec: number } => {
  const ip = clientIp(req);
  if (!ip) {
    return { limited: false, retryAfterSec: 0 }; // local dev has no forwarding header
  }

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  if (dailyCount.day !== today) {
    dailyCount = { day: today, count: 0 };
  }
  dailyCount.count += 1;
  if (dailyCount.count > DAILY_MAX) {
    return { limited: true, retryAfterSec: Math.ceil((86400 * 1000 - (now - new Date(`${today}T00:00:00Z`).getTime())) / 1000) };
  }

  const window = ipWindows.get(ip);
  if (!window || now - window.start > RATE_WINDOW_MS) {
    ipWindows.set(ip, { count: 1, start: now });
    return { limited: false, retryAfterSec: 0 };
  }

  window.count += 1;
  if (window.count > RATE_MAX_PER_IP) {
    return { limited: true, retryAfterSec: Math.ceil((window.start + RATE_WINDOW_MS - now) / 1000) };
  }
  return { limited: false, retryAfterSec: 0 };
};

// --- upstream calls ----------------------------------------------------------

const extractImageB64 = (buffer: Buffer): Buffer | null => {
  if (buffer.length > 4 && buffer[0] === 0x7b /* '{' */) {
    try {
      const data = JSON.parse(buffer.toString('utf8')) as {
        result?: { image?: string };
        image?: string;
      };
      const b64 = data?.result?.image ?? data?.image;
      return b64 ? Buffer.from(b64, 'base64') : null;
    } catch {
      return null;
    }
  }
  return buffer.byteLength > 0 ? buffer : null;
};

const extractNeurons = (buffer: Buffer): number | undefined => {
  if (buffer.length > 4 && buffer[0] === 0x7b) {
    try {
      const data = JSON.parse(buffer.toString('utf8')) as { usage?: { neurons?: number } };
      const neurons = data?.usage?.neurons;
      return typeof neurons === 'number' ? neurons : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/** Pulls a base64 data URL or bare base64 payload apart into raw bytes. */
const decodeReferenceImage = (input: unknown): { bytes: Buffer; mime: string } | null => {
  if (typeof input !== 'string' || input.length < 32) return null;
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/is.exec(input);
  const mime = match ? match[1] : 'image/png';
  const b64 = match ? match[2] : input;
  if (!/^[A-Za-z0-9+/=\s]+$/.test(b64.slice(0, 256))) return null;
  const bytes = Buffer.from(b64.replace(/\s/g, ''), 'base64');
  if (bytes.byteLength < 64 || bytes.byteLength > 1_500_000) return null;
  return { bytes, mime };
};

async function runModel(
  model: string,
  prompt: string,
  accountId: string,
  apiToken: string,
  options: {
    width?: number;
    height?: number;
    steps?: number;
    guidance?: number;
    seed?: number;
    reference?: { bytes: Buffer; mime: string };
    binaryResponse?: boolean;
    fixedSteps?: number;
  } = {}
): Promise<GeneratedImage> {
  const started = Date.now();
  let response: Response;

  if (options.reference || options.width || options.height || options.fixedSteps !== undefined) {
    // FLUX.2 family: multipart form input, even for plain text prompts.
    const form = new FormData();
    form.append('prompt', prompt);
    if (options.width) form.append('width', String(options.width));
    if (options.height) form.append('height', String(options.height));
    if (options.guidance) form.append('guidance', String(options.guidance));
    if (options.seed !== undefined) form.append('seed', String(options.seed));
    if (options.fixedSteps) form.append('steps', String(options.fixedSteps));
    else if (options.steps) form.append('steps', String(options.steps));
    if (options.reference) {
      form.append(
        'input_image_0',
        new Blob([new Uint8Array(options.reference.bytes)], { type: options.reference.mime }),
        'reference.png'
      );
    }
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiToken}` },
      body: form,
      signal: AbortSignal.timeout(55_000),
    });
  } else {
    const body: Record<string, unknown> = { prompt };
    if (options.steps) body.steps = options.steps;
    if (options.guidance) body.guidance = options.guidance;
    if (options.width) body.width = options.width;
    if (options.height) body.height = options.height;
    if (options.seed !== undefined) body.seed = options.seed;
    response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(55_000),
    });
  }

  const upstreamBuffer = Buffer.from(await response.arrayBuffer());
  const latencyMs = Date.now() - started;
  const neurons = extractNeurons(upstreamBuffer);
  console.error(
    `generate: model=${model} status=${response.status} latency=${latencyMs}ms neurons=${neurons ?? 'n/a'}`
  );

  if (!response.ok) {
    let detail = '';
    try {
      detail = JSON.parse(upstreamBuffer.toString('utf8'))?.errors?.[0]?.message ?? '';
    } catch {
      /* non-JSON error body */
    }
    throw new Error(`Model ${model} returned ${response.status}${detail ? `: ${detail}` : '.'}`);
  }

  const image = extractImageB64(upstreamBuffer);
  if (!image) {
    throw new Error(`Model ${model} returned no image.`);
  }

  return {
    b64: image.toString('base64'),
    mimeType: sniffMimeType(image),
    neurons,
  };
}

interface GenerateRequest {
  prompt?: unknown;
  model?: unknown;
  width?: unknown;
  height?: unknown;
  steps?: unknown;
  guidance?: unknown;
  seed?: unknown;
  referenceImage?: unknown;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { limited, retryAfterSec } = rateLimited(req);
  if (limited) {
    res.setHeader('Retry-After', String(Math.max(retryAfterSec, 1)));
    return res.status(429).json({
      error: 'Generation limit reached. Please try again a bit later.',
    });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({ error: 'AI generation is not configured yet.' });
  }

  const body = (req.body ?? {}) as GenerateRequest;
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1200) : '';
  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  const reference = decodeReferenceImage(body.referenceImage);

  // Explicit model: honor size/step options with per-model validation.
  const modelKey = typeof body.model === 'string' ? body.model.trim() : '';
  if (modelKey) {
    const spec = MODEL_CATALOG[modelKey];
    if (!spec) {
      return res.status(400).json({ error: `Unknown model "${modelKey}".` });
    }

    const clampSide = (value: unknown): number | undefined => {
      const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
      if (!Number.isFinite(n)) return undefined;
      if (spec.fixedSide) return spec.fixedSide;
      const min = spec.minSide ?? 256;
      const max = spec.maxSide ?? 1920;
      return Math.min(max, Math.max(min, Math.round(n)));
    };

    const width = clampSide(body.width);
    const height = clampSide(body.height);

    let steps: number | undefined;
    if (spec.fixedSteps) {
      steps = spec.fixedSteps;
    } else if (spec.steps) {
      const requested = typeof body.steps === 'number' ? body.steps : Number.parseInt(String(body.steps ?? ''), 10);
      steps = Number.isFinite(requested)
        ? Math.min(spec.steps.max, Math.max(spec.steps.min, requested))
        : spec.steps.default;
    }

    const guidance =
      typeof body.guidance === 'number' && body.guidance > 0 ? body.guidance : undefined;
    const seed =
      typeof body.seed === 'number' && Number.isInteger(body.seed) && body.seed >= 0
        ? body.seed
        : undefined;

    try {
      const generated = await runModel(spec.id, prompt, accountId, apiToken, {
        width,
        height,
        steps,
        guidance,
        seed,
        reference: reference ?? undefined,
        binaryResponse: spec.binaryResponse,
        fixedSteps: spec.fixedSteps,
      });
      return res.status(200).json({
        imageB64: generated.b64,
        mimeType: generated.mimeType,
        model: spec.id,
        ...(generated.neurons !== undefined ? { neurons: generated.neurons } : {}),
      });
    } catch (error) {
      console.error('generate:', error instanceof Error ? error.message : error);
      return res.status(502).json({ error: 'Image generation failed. Try again.' });
    }
  }

  // Legacy chain: try each configured model in order.
  const models = configuredModels();
  const chain = models.length > 0 ? models : DEFAULT_MODELS;
  let lastError: unknown = null;

  for (const model of chain) {
    try {
      const generated = await runModel(model, prompt, accountId, apiToken);
      return res.status(200).json({
        imageB64: generated.b64,
        mimeType: generated.mimeType,
        model,
        ...(generated.neurons !== undefined ? { neurons: generated.neurons } : {}),
      });
    } catch (error) {
      lastError = error;
      console.error('generate:', error instanceof Error ? error.message : error);
    }
  }

  console.error('generate: all models failed', lastError);
  return res.status(502).json({ error: 'Image generation failed. Try again.' });
}
