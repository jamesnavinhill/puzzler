import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * AI image generation for puzzle creation.
 *
 * Runs Cloudflare Workers AI text-to-image models through the REST API. The
 * default is FLUX.1 schnell; if a model is unavailable the request falls back
 * through the chain below. Model output is normalized to base64 because
 * Workers AI returns either JSON base64 or raw image bytes depending on the
 * model.
 */
const DEFAULT_MODELS = [
  '@cf/black-forest-labs/flux-1-schnell',
  '@cf/bytedance/stable-diffusion-xl-lightning',
  '@cf/lykon/dreamshaper-8-lcm',
];

export const maxDuration = 60;

interface GeneratedImage {
  b64: string;
  mimeType: string;
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

async function runModel(
  model: string,
  prompt: string,
  accountId: string,
  apiToken: string
): Promise<GeneratedImage> {
  const body: Record<string, unknown> = { prompt };

  // FLUX accepts only prompt and steps; four is the documented default.
  if (model.includes('flux-1-schnell')) {
    body.steps = 4;
  }

  const upstream = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );

  if (!upstream.ok) {
    throw new Error(`Model ${model} returned ${upstream.status}.`);
  }

  const contentType = upstream.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const data = (await upstream.json()) as {
      result?: { image?: string };
      image?: string;
    };
    const b64 = data?.result?.image ?? data?.image ?? '';

    if (!b64) {
      throw new Error(`Model ${model} returned no image.`);
    }

    return {
      b64,
      mimeType: sniffMimeType(Buffer.from(b64.slice(0, 32), 'base64')),
    };
  }

  if (contentType.startsWith('image/') || contentType.includes('octet-stream')) {
    const buffer = Buffer.from(await upstream.arrayBuffer());

    if (buffer.byteLength === 0) {
      throw new Error(`Model ${model} returned an empty image.`);
    }

    return {
      b64: buffer.toString('base64'),
      mimeType: sniffMimeType(buffer),
    };
  }

  throw new Error(`Model ${model} returned an unexpected response.`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) {
    return res.status(503).json({ error: 'AI generation is not configured yet.' });
  }

  const prompt =
    typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 1200) : '';
  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  const models = configuredModels();
  const chain = models.length > 0 ? models : DEFAULT_MODELS;
  let lastError: unknown = null;

  for (const model of chain) {
    try {
      const generated = await runModel(model, prompt, accountId, apiToken);
      return res.status(200).json({
        imageB64: generated.b64,
        mimeType: generated.mimeType,
      });
    } catch (error) {
      lastError = error;
      console.error('generate:', error instanceof Error ? error.message : error);
    }
  }

  console.error('generate: all models failed', lastError);
  return res.status(502).json({ error: 'Image generation failed. Try again.' });
}
