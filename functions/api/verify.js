/**
 * Cloudflare Pages Function: POST /api/verify
 *
 * Verifies the access passphrase and sets a signed cookie on success.
 * Rate-limited to 5 attempts per IP per minute.
 *
 * Required environment variables (set in Cloudflare Pages dashboard):
 *   ACCESS_CODE_HASH  — SHA-256 hex hash of your chosen passphrase
 *   COOKIE_SECRET     — Random string for HMAC signing cookies (32+ chars)
 */

// ── In-memory rate limiter (resets on cold start, which is fine) ──
const attempts = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const record = attempts.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    attempts.set(ip, { windowStart: now, count: 1 });
    return false;
  }

  record.count++;
  if (record.count > RATE_LIMIT_MAX) {
    return true;
  }
  return false;
}

// ── Helpers ──
async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSign(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Handler ──
export async function onRequestPost(context) {
  const { request, env } = context;

  const ACCESS_CODE_HASH = env.ACCESS_CODE_HASH || '';
  const COOKIE_SECRET = env.COOKIE_SECRET || '';
  const BASE_PATH = env.BASE_PATH || '/';

  if (!ACCESS_CODE_HASH || !COOKIE_SECRET) {
    return new Response('Server misconfigured', { status: 500 });
  }

  // Rate limit by IP
  const ip = request.headers.get('cf-connecting-ip')
    || request.headers.get('x-forwarded-for')
    || 'unknown';

  if (isRateLimited(ip)) {
    return Response.redirect(
      new URL(`${BASE_PATH}products?error=rate_limited`, request.url).toString(),
      303
    );
  }

  // Parse form body
  const formData = await request.formData();
  const code = (formData.get('code') || '').toString().trim();

  if (!code) {
    return Response.redirect(
      new URL(`${BASE_PATH}products?error=invalid`, request.url).toString(),
      303
    );
  }

  // Hash the submitted code and compare
  const submittedHash = await sha256Hex(code);

  if (submittedHash !== ACCESS_CODE_HASH) {
    // Track failed attempts in PostHog server-side would require the
    // posthog-node library; for now we rely on the client-side tracking
    // in AccessGate.astro.
    return Response.redirect(
      new URL(`${BASE_PATH}products?error=invalid`, request.url).toString(),
      303
    );
  }

  // ── Success: create signed cookie ──
  const timestamp = Date.now().toString();
  const signature = await hmacSign(COOKIE_SECRET, timestamp);
  const token = `${timestamp}.${signature}`;

  // Set httpOnly cookie — persists indefinitely (no Max-Age = session only in
  // some browsers, so we set a very long Max-Age: ~10 years)
  const cookie = [
    `access_token=${token}`,
    `Path=${BASE_PATH}`,
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=315360000', // ~10 years
  ].join('; ');

  return new Response(null, {
    status: 303,
    headers: {
      Location: new URL(`${BASE_PATH}products`, request.url).toString(),
      'Set-Cookie': cookie,
    },
  });
}
