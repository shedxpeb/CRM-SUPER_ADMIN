/**
 * SUPER-ADMIN E2E Test Spec
 * Tests the API like a real user through the browser.
 * Requires backend running at http://localhost:8001
 *
 * Usage: node test\super-admin.e2e-spec.js
 */

const BASE = 'http://localhost:8001';
const EMAIL = 'admin@pebcrm.com';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
if (!PASSWORD) throw new Error('SUPER_ADMIN_PASSWORD env is required for e2e tests');
const ORIGIN = 'http://localhost:3001';

let passed = 0;
let failed = 0;
let authToken = '';

async function req(method, path, opts = {}) {
  const headers = { ...opts.headers };
  if (opts.json !== undefined) {
    headers['content-type'] = 'application/json';
  }
  if (opts.token) {
    headers['authorization'] = `Bearer ${opts.token}`;
  }
  if (opts.origin) {
    headers['origin'] = opts.origin;
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: opts.json !== undefined ? JSON.stringify(opts.json) : undefined,
  });
  const body = await res.text().catch(() => '');
  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch {
    parsed = body;
  }
  return { status: res.status, headers: res.headers, body: parsed };
}

async function runTest(name, fn) {
  const start = Date.now();
  try {
    await fn();
    console.log(`  \x1b[32mPASS\x1b[0m  ${name} (${Date.now() - start}ms)`);
    passed++;
  } catch (err) {
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}`);
    console.log(`        \x1b[31m${err.message}\x1b[0m`);
    failed++;
  }
}

function ok(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function eq(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(msg || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

async function main() {
  console.log('\n\x1b[36m═══════════════════════════════════════════\x1b[0m');
  console.log('\x1b[36m  SUPER-ADMIN End-to-End Test Suite\x1b[0m');
  console.log('\x1b[36m═══════════════════════════════════════════\x1b[0m\n');

  // ── 1. Health ────────────────────────────────────────
  console.log('\x1b[33m── Health Check ──\x1b[0m');
  await runTest('GET /health returns 200', async () => {
    const res = await req('GET', '/health');
    eq(res.status, 200);
  });
  await runTest('GET /health/modules returns 200', async () => {
    const res = await req('GET', '/health/modules');
    eq(res.status, 200);
  });

  // ── 2. CORS Preflight ────────────────────────────────
  console.log('\n\x1b[33m── CORS Preflight ──\x1b[0m');
  await runTest('OPTIONS /auth/login returns 204', async () => {
    const res = await req('OPTIONS', '/auth/login', { origin: ORIGIN });
    eq(res.status, 204);
  });
  await runTest('OPTIONS response has CORS headers', async () => {
    const res = await req('OPTIONS', '/auth/login', { origin: ORIGIN });
    ok(res.headers.get('access-control-allow-origin') === ORIGIN, 'Missing allow-origin header');
  });

  // ── 3. Login Validation ─────────────────────────────
  console.log('\n\x1b[33m── Login Validation ──\x1b[0m');
  await runTest('POST /auth/login with empty body returns 400', async () => {
    const res = await req('POST', '/auth/login', { json: {} });
    eq(res.status, 400);
  });
  await runTest('POST /auth/login with wrong password returns 401', async () => {
    const res = await req('POST', '/auth/login', { json: { email: EMAIL, password: 'wrong' } });
    eq(res.status, 401);
  });

  // ── 4. Successful Login ─────────────────────────────
  console.log('\n\x1b[33m── Login ──\x1b[0m');
  await runTest('POST /auth/login with correct credentials succeeds', async () => {
    const res = await req('POST', '/auth/login', { json: { email: EMAIL, password: PASSWORD } });
    eq(res.status, 201, `Expected 201, got ${res.status}: ${JSON.stringify(res.body)}`);
    ok(res.body.success === true, 'response.success should be true');
    ok(res.body.data !== undefined, 'response.data should exist');
    ok(
      typeof res.body.data.accessToken === 'string' && res.body.data.accessToken.length > 0,
      'accessToken should be a non-empty string',
    );
    ok(res.body.data.user.email === EMAIL, `email should be ${EMAIL}`);
    eq(res.body.data.user.role, 'SUPER_ADMIN', 'role should be SUPER_ADMIN');
    authToken = res.body.data.accessToken;
  });

  // ── 5. Auth Profile ────────────────────────────────
  console.log('\n\x1b[33m── Profile ──\x1b[0m');
  await runTest('GET /auth/me without token returns 401', async () => {
    const res = await req('GET', '/auth/me');
    eq(res.status, 401);
  });
  await runTest('GET /auth/me with valid token returns profile', async () => {
    const res = await req('GET', '/auth/me', { token: authToken });
    eq(res.status, 200);
    ok(res.body.data.email === EMAIL, `email should be ${EMAIL}`);
    eq(res.body.data.role, 'SUPER_ADMIN');
  });

  // ── 6. Protected Routes ─────────────────────────────
  console.log('\n\x1b[33m── Protected Routes ──\x1b[0m');
  await runTest('GET /users returns 200', async () => {
    const res = await req('GET', '/users', { token: authToken });
    eq(res.status, 200);
  });
  await runTest('GET /organization returns 200', async () => {
    const res = await req('GET', '/organization', { token: authToken });
    eq(res.status, 200);
  });
  await runTest('GET /roles returns 200', async () => {
    const res = await req('GET', '/roles', { token: authToken });
    eq(res.status, 200);
  });
  await runTest('GET /lead returns 200', async () => {
    const res = await req('GET', '/lead', { token: authToken });
    eq(res.status, 200);
  });

  // ── 7. Logout ───────────────────────────────────────
  console.log('\n\x1b[33m── Logout ──\x1b[0m');
  await runTest('POST /auth/logout succeeds', async () => {
    const res = await req('POST', '/auth/logout', { token: authToken });
    eq(res.status, 201);
  });
  await runTest('Old token is invalid after logout', async () => {
    const res = await req('GET', '/auth/me', { token: authToken });
    eq(res.status, 401);
  });

  // ── Summary ─────────────────────────────────────────
  const total = passed + failed;
  console.log(`\n\x1b[36m───────────────────────────────────────\x1b[0m`);
  console.log(`  \x1b[32m${passed} passed\x1b[0m  \x1b[31m${failed} failed\x1b[0m  ${total} total`);
  console.log(`\x1b[36m───────────────────────────────────────\x1b[0m\n`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
