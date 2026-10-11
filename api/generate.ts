import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * AI image generation for puzzle creation — "describe your puzzle".
 * Proxies the Agency gateway's OpenAI-shaped /images/generations endpoint so
 * the gateway key stays server-side. The model is env-configurable
 * (YRKA_IMAGE_MODEL); the default is a cheap/effective free-tier model.
 */
const GATEWAY_BASE_URL = process.env.YRKA_GATEWAY_BASE_URL || 'https://gateway.yrka.io/v1';
const IMAGE_MODEL = process.env.YRKA_IMAGE_MODEL || 'cf-img-flux-1-schnell';

export const maxDuration = 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.YRKA_GATEWAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'AI generation is not configured yet.' });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 1000) : '';
  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  try {
    const upstream = await fetch(`${GATEWAY_BASE_URL}/images/generations`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'x-agency-surface': 'puzzler',
      },
      body: JSON.stringify({ model: IMAGE_MODEL, prompt, n: 1 }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status === 401 ? 503 : 502).json({
        error: `Image generation failed (${upstream.status}).`,
      });
    }

    const data = await upstream.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      return res.status(502).json({ error: 'Image generation returned no image.' });
    }

    return res.status(200).json({ imageB64: b64 });
  } catch (error) {
    console.error('generate error:', error);
    return res.status(502).json({ error: 'Image generation request failed.' });
  }
}
