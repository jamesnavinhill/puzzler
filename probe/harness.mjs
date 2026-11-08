/**
 * Puzzler model probe harness.
 *
 * Runs one generation against Cloudflare Workers AI and records the result.
 * Usage:
 *   node probe/harness.mjs run <model-key> <out-path> --prompt "..." \
 *        [--ref path] [--ref2 path] [--width N] [--height N] [--steps N] \
 *        [--guidance F] [--seed N] [--note "label"]
 *
 * Requires CF_ACCOUNT_ID and CF_API_TOKEN in the environment.
 * Appends one JSON line per run to probe/results.jsonl.
 */
import fs from 'node:fs';
import path from 'node:path';

const ACCOUNT = process.env.CF_ACCOUNT_ID;
const TOKEN = process.env.CF_API_TOKEN;
const API = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/ai/run`;

const MODELS = {
  'klein-9b': {
    id: '@cf/black-forest-labs/flux-2-klein-9b',
    shape: 'multipart',
    steps: 'fixed4',
    ext: 'png',
  },
  'klein-4b': {
    id: '@cf/black-forest-labs/flux-2-klein-4b',
    shape: 'multipart',
    steps: 'fixed4',
    ext: 'png',
  },
  'flux-2-dev': {
    id: '@cf/black-forest-labs/flux-2-dev',
    shape: 'multipart',
    steps: 'optional',
    ext: 'png',
  },
  'lucid-origin': {
    id: '@cf/leonardo/lucid-origin',
    shape: 'json',
    steps: 'optional',
    ext: 'png',
  },
  'phoenix-1.0': {
    id: '@cf/leonardo/phoenix-1.0',
    shape: 'json',
    steps: 'optional',
    ext: 'jpg',
  },
  'schnell': {
    id: '@cf/black-forest-labs/flux-1-schnell',
    shape: 'json',
    steps: 'optional',
    ext: 'png',
  },
};

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      if (key === 'ref' || key === 'ref2' || key === 'ref3') {
        args[key] = argv[++i];
      } else {
        args[key] = argv[++i];
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function collectUsage(obj) {
  // usage may sit at top level or nested; pull anything neuron-shaped
  if (!obj || typeof obj !== 'object') return undefined;
  const u = obj.usage ?? obj.result?.usage;
  return u ?? undefined;
}

async function run(modelKey, outPath, args) {
  const model = MODELS[modelKey];
  if (!model) throw new Error(`unknown model key: ${modelKey}`);
  const prompt = args.prompt;
  if (!prompt) throw new Error('--prompt required');

  const started = Date.now();
  let res, requestBody, headers = { Authorization: `Bearer ${TOKEN}` };

  if (model.shape === 'multipart') {
    const form = new FormData();
    form.append('prompt', prompt);
    if (args.width) form.append('width', args.width);
    if (args.height) form.append('height', args.height);
    if (args.guidance) form.append('guidance', args.guidance);
    if (args.seed !== undefined) form.append('seed', args.seed);
    // klein-9b/4b have steps fixed at 4 server-side; harmless to omit
    if (args.steps && model.steps === 'optional') form.append('steps', args.steps);
    for (const [slot, key] of [['ref', 'input_image_0'], ['ref2', 'input_image_1'], ['ref3', 'input_image_2']]) {
      if (args[slot]) {
        const buf = fs.readFileSync(args[slot]);
        form.append(key, new Blob([buf], { type: 'image/png' }), path.basename(args[slot]));
      }
    }
    requestBody = form;
  } else {
    headers['Content-Type'] = 'application/json';
    const body = { prompt };
    if (args.width) body.width = Number(args.width);
    if (args.height) body.height = Number(args.height);
    if (args.steps) body.steps = Number(args.steps);
    if (args.guidance) body.guidance = Number(args.guidance);
    if (args.seed !== undefined) body.seed = Number(args.seed);
    requestBody = JSON.stringify(body);
  }

  res = await fetch(`${API}/${model.id}`, {
    method: 'POST',
    headers,
    body: requestBody,
  });
  const latencyMs = Date.now() - started;

  const contentType = res.headers.get('content-type') ?? '';
  let usage, errorDetail = null, ok = res.ok, bytesWritten = 0;

  if (contentType.includes('application/json')) {
    const data = await res.json();
    usage = collectUsage(data);
    const b64 = data?.result?.image ?? data?.image;
    if (res.ok && b64) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      bytesWritten = Buffer.from(b64, 'base64').byteLength;
    } else {
      errorDetail = JSON.stringify(data).slice(0, 500);
    }
  } else {
    const buf = Buffer.from(await res.arrayBuffer());
    if (res.ok && buf.byteLength > 0) {
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, buf);
      bytesWritten = buf.byteLength;
    } else {
      errorDetail = buf.toString('utf8').slice(0, 500);
    }
  }

  const record = {
    ts: new Date().toISOString(),
    model: model.id,
    key: modelKey,
    note: args.note ?? '',
    prompt,
    ref: args.ref ? path.basename(args.ref) : null,
    width: args.width ? Number(args.width) : null,
    height: args.height ? Number(args.height) : null,
    steps: args.steps ? Number(args.steps) : null,
    guidance: args.guidance ? Number(args.guidance) : null,
    seed: args.seed !== undefined ? Number(args.seed) : null,
    httpStatus: res.status,
    ok,
    latencyMs,
    outputBytes: bytesWritten,
    outPath,
    usage: usage ?? null,
    error: errorDetail,
  };
  fs.appendFileSync('probe/results.jsonl', JSON.stringify(record) + '\n');
  console.log(JSON.stringify(record, null, 1));
  if (!ok) process.exitCode = 1;
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'run') {
  const [modelKey, outPath] = rest;
  await run(modelKey, outPath, parseArgs(process.argv.slice(4)));
} else {
  console.error('usage: node probe/harness.mjs run <model-key> <out-path> --prompt "..." [--ref path] [--width N] [--height N] [--steps N] [--guidance F] [--seed N] [--note "..."]');
  process.exit(1);
}
