/**
 * Vérifications sécurité API prod (headers, fuites d'info, auth admin).
 * Usage: node scripts/verify-security.js
 */
const BASE = process.env.API_BASE || 'https://figsappcotedivoire.com';

async function fetchApi(path, options = {}, timeoutMs = 25000) {
  const url = `${BASE}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      body = { _raw: text.slice(0, 200) };
    }
    return { status: res.status, body, headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const failures = [];
  const ok = (label, cond, detail = '') => {
    const line = `  ${cond ? 'OK' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`;
    console.log(line);
    if (!cond) failures.push(label);
  };

  console.log(`\n=== Vérification sécurité API (${BASE}) ===\n`);

  const ping = await fetchApi('/api/ping');
  ok('Ping accessible', ping.status === 200 && ping.body?.ok === true);
  ok('Ping sans fuite config', !ping.body?.hasJwtSecret && !ping.body?.hasDatabaseUrl && !ping.body?.hasPostgresUrl);
  ok('Headers X-Content-Type-Options', ping.headers.get('x-content-type-options') === 'nosniff');
  ok('Headers X-Frame-Options', ping.headers.get('x-frame-options') === 'DENY');
  ok('Headers Referrer-Policy', Boolean(ping.headers.get('referrer-policy')));
  if (BASE.startsWith('https://')) {
    ok('Headers HSTS', Boolean(ping.headers.get('strict-transport-security')));
  }

  const me = await fetchApi('/api/admin/me');
  ok('Admin /me sans session → 401', me.status === 401);

  const badLogin = await fetchApi('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'security.probe@figsapp-test.local', password: 'wrong-password-12' }),
  });
  ok('Login invalide → 401', badLogin.status === 401);

  const evilOrigin = await fetchApi('/api/filieres?type=privee', {
    headers: { Origin: 'https://evil-phishing.example.com' },
  });
  const acao = evilOrigin.headers.get('access-control-allow-origin');
  ok('Pas de CORS ouvert vers origine malveillante', acao !== 'https://evil-phishing.example.com');

  const health = await fetchApi('/api/health');
  ok('Health minimal', health.body?.ok === true && !health.body?.jwt && !health.body?.db && !health.body?.hasJwtSecret);

  console.log('');
  if (failures.length) {
    console.error(`Échec: ${failures.length} test(s) — ${failures.join(', ')}`);
    process.exit(1);
  }
  console.log('Tous les tests sécurité sont OK.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
