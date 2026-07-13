/**
 * SUPER-ADMIN Real API Test
 * Tests against the running backend at http://localhost:8001
 * Run: npx ts-node --transpile-only test-api.ts
 */

const BASE = 'http://localhost:8001';

async function request(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, headers: Object.fromEntries(res.headers.entries()), body: json };
}

async function main() {
  let pass = 0, fail = 0;
  const check = (name: string, ok: boolean) => { console.log(`${ok ? '  PASS' : '  FAIL'}: ${name}`); ok ? pass++ : fail++; };

  console.log('\n=== SUPER-ADMIN API TESTS ===\n');

  // 1. Health check
  const health = await request('GET', '/health');
  check('GET /health returns 200', health.status === 200);

  // 2. CORS preflight (OPTIONS)
  const corsRes = await fetch(`${BASE}/auth/login`, { method: 'OPTIONS', headers: { origin: 'http://localhost:3001' } });
  check('OPTIONS /auth/login returns 204', corsRes.status === 204);
  check('CORS has Access-Control-Allow-Origin header', corsRes.headers.get('access-control-allow-origin') === 'http://localhost:3001');

  // 3. Login without body (should fail validation)
  const loginBad = await request('POST', '/auth/login', {});
  check('POST /auth/login (empty) returns 400', loginBad.status === 400);

  // 4. Login with wrong password
  const loginWrong = await request('POST', '/auth/login', { email: 'admin@pebcrm.com', password: 'wrongpass' });
  check('POST /auth/login (wrong password) returns 401', loginWrong.status === 401);

  // 5. Login with correct credentials
  const loginOk = await request('POST', '/auth/login', { email: 'admin@pebcrm.com', password: 'Admin@123' });
  check('POST /auth/login (correct) returns 200 or 201', loginOk.status === 200 || loginOk.status === 201);
  const hasToken = loginOk.body?.data?.accessToken || loginOk.body?.accessToken;
  check('Response contains access token', !!hasToken);
  const token = hasToken || '';

  // 6. GET /auth/me with token
  if (token) {
    const me = await request('GET', '/auth/me', undefined, token);
    check('GET /auth/me returns 200', me.status === 200);
    check('Response has user data', !!me.body?.data?.email || !!me.body?.email);
  }

  // 7. Logout
  const logout = await request('POST', '/auth/logout', {}, token);
  check('POST /auth/logout returns 200 or 201', logout.status === 200 || logout.status === 201);

  // 8. GET /health/modules
  const modules = await request('GET', '/health/modules');
  check('GET /health/modules returns 200', modules.status === 200);

  // Summary
  console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed (${pass + fail} total) ===\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});