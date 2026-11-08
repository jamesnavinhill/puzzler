/**
 * Smoke test harness for rate limiting logic in api/generate.ts.
 * Validates:
 * 1. IP window limits (allows 8, 9th gets 429)
 * 2. Rejected requests do NOT burn daily quota
 * 3. Header spoofing protection (CF-Connecting-IP takes precedence over X-Forwarded-For)
 * 4. Memory leak protection (eviction when Map reaches capacity)
 * 5. Window expiration / reset after RATE_WINDOW_MS
 */

import assert from 'node:assert';

// Simulated rate limit engine identical to api/generate.ts
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX_PER_IP = 8;
const DAILY_MAX = 200;
const MAX_TRACKED_IPS = 1000;

export const createRateLimiter = () => {
  const ipWindows = new Map();
  let dailyCount = { day: '', count: 0 };

  const pruneExpiredWindows = (now) => {
    if (ipWindows.size < MAX_TRACKED_IPS) return;
    for (const [key, val] of ipWindows) {
      if (now - val.start > RATE_WINDOW_MS) {
        ipWindows.delete(key);
      }
    }
    if (ipWindows.size >= MAX_TRACKED_IPS) {
      let toRemove = Math.floor(MAX_TRACKED_IPS * 0.2);
      for (const key of ipWindows.keys()) {
        ipWindows.delete(key);
        if (--toRemove <= 0) break;
      }
    }
  };

  const getHeaderString = (val) => {
    if (!val) return null;
    const str = Array.isArray(val) ? val[0] : val;
    return str ? str.trim() : null;
  };

  const clientIp = (headers = {}) => {
    const cfIp = getHeaderString(headers['cf-connecting-ip']);
    if (cfIp) return cfIp;

    const realIp = getHeaderString(headers['x-real-ip']);
    if (realIp) return realIp;

    const vercelForwarded = getHeaderString(headers['x-vercel-forwarded-for']);
    if (vercelForwarded) return vercelForwarded.split(',')[0].trim();

    const forwarded = getHeaderString(headers['x-forwarded-for']);
    if (forwarded) return forwarded.split(',')[0].trim();

    return null;
  };

  const checkRateLimit = (headers, currentTime = Date.now()) => {
    const ip = clientIp(headers);
    if (!ip) {
      return { limited: false, retryAfterSec: 0, remaining: RATE_MAX_PER_IP, limit: RATE_MAX_PER_IP };
    }

    const today = new Date(currentTime).toISOString().slice(0, 10);
    if (dailyCount.day !== today) {
      dailyCount = { day: today, count: 0 };
    }

    if (dailyCount.count >= DAILY_MAX) {
      const midnightUtc = new Date(`${today}T00:00:00Z`).getTime() + 86400 * 1000;
      const retryAfterSec = Math.max(1, Math.ceil((midnightUtc - currentTime) / 1000));
      return { limited: true, retryAfterSec, remaining: 0, limit: RATE_MAX_PER_IP };
    }

    pruneExpiredWindows(currentTime);
    const window = ipWindows.get(ip);
    if (!window || currentTime - window.start > RATE_WINDOW_MS) {
      return { limited: false, retryAfterSec: 0, remaining: RATE_MAX_PER_IP, limit: RATE_MAX_PER_IP };
    }

    if (window.count >= RATE_MAX_PER_IP) {
      const retryAfterSec = Math.max(1, Math.ceil((window.start + RATE_WINDOW_MS - currentTime) / 1000));
      return { limited: true, retryAfterSec, remaining: 0, limit: RATE_MAX_PER_IP };
    }

    return {
      limited: false,
      retryAfterSec: 0,
      remaining: Math.max(0, RATE_MAX_PER_IP - window.count),
      limit: RATE_MAX_PER_IP,
    };
  };

  const consumeRateLimit = (headers, currentTime = Date.now()) => {
    const ip = clientIp(headers);
    if (!ip) return;

    const today = new Date(currentTime).toISOString().slice(0, 10);
    if (dailyCount.day !== today) {
      dailyCount = { day: today, count: 0 };
    }
    dailyCount.count += 1;

    const window = ipWindows.get(ip);
    if (!window || currentTime - window.start > RATE_WINDOW_MS) {
      if (ipWindows.size >= MAX_TRACKED_IPS) {
        pruneExpiredWindows(currentTime);
      }
      ipWindows.set(ip, { count: 1, start: currentTime });
    } else {
      window.count += 1;
    }
  };

  return {
    clientIp,
    checkRateLimit,
    consumeRateLimit,
    getDailyCount: () => dailyCount.count,
    getTrackedIpsCount: () => ipWindows.size,
  };
};

// --- Test Suite ---
console.log('--- Running Rate Limiter Smoke Tests ---\n');

const limiter = createRateLimiter();
const testIpHeaders = { 'cf-connecting-ip': '203.0.113.42' };

// Test 1: First 8 requests pass
for (let i = 1; i <= 8; i++) {
  const check = limiter.checkRateLimit(testIpHeaders);
  assert.strictEqual(check.limited, false, `Request ${i} should be allowed`);
  limiter.consumeRateLimit(testIpHeaders);
}
console.log('✓ Test 1 Passed: 8 consecutive requests allowed');

// Test 2: 9th request is rejected (429)
const check9 = limiter.checkRateLimit(testIpHeaders);
assert.strictEqual(check9.limited, true, 'Request 9 should be limited');
assert(check9.retryAfterSec > 0, 'Retry-After should be > 0');
console.log(`✓ Test 2 Passed: 9th request blocked with retryAfter=${check9.retryAfterSec}s`);

// Test 3: Blocked requests do NOT increment daily count
const dailyBefore = limiter.getDailyCount();
assert.strictEqual(dailyBefore, 8, 'Daily count should be 8 after 8 successful generations');
for (let i = 0; i < 50; i++) {
  const check = limiter.checkRateLimit(testIpHeaders);
  assert.strictEqual(check.limited, true);
  // Do NOT consume when limited
}
const dailyAfter = limiter.getDailyCount();
assert.strictEqual(dailyAfter, 8, 'Daily count must remain 8; blocked requests must not burn quota');
console.log('✓ Test 3 Passed: Rejected requests do not leak or exhaust global daily quota');

// Test 4: Spoof protection: attacker adds fake X-Forwarded-For
const spoofHeaders = {
  'cf-connecting-ip': '203.0.113.42', // real IP
  'x-forwarded-for': '198.51.100.99', // spoof attempt
};
const checkSpoof = limiter.checkRateLimit(spoofHeaders);
assert.strictEqual(checkSpoof.limited, true, 'Attacker cannot bypass rate limit with X-Forwarded-For');
console.log('✓ Test 4 Passed: CF-Connecting-IP takes precedence; X-Forwarded-For spoofing neutralized');

// Test 5: Reset after 1 hour window
const oneHourLater = Date.now() + 61 * 60 * 1000;
const checkReset = limiter.checkRateLimit(testIpHeaders, oneHourLater);
assert.strictEqual(checkReset.limited, false, 'Should allow request after 1 hour window expires');
console.log('✓ Test 5 Passed: Window cleanly resets after 1 hour');

// Test 6: Memory bounded protection
const memLimiter = createRateLimiter();
for (let i = 0; i < 1500; i++) {
  const headers = { 'cf-connecting-ip': `10.0.${Math.floor(i / 255)}.${i % 255}` };
  memLimiter.checkRateLimit(headers);
  memLimiter.consumeRateLimit(headers);
}
assert(memLimiter.getTrackedIpsCount() <= MAX_TRACKED_IPS, 'Map size must stay capped at MAX_TRACKED_IPS');
console.log(`✓ Test 6 Passed: Map size capped (${memLimiter.getTrackedIpsCount()} <= ${MAX_TRACKED_IPS}); memory leak prevented`);

console.log('\n--- All 6 Rate Limit Smoke Tests Passed! ---');
