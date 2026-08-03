/**
 * Vérifie que l'API locale répond (API sur :5000).
 * Usage: node scripts/test-local-api.js
 */
const BASE = process.env.API_BASE || 'http://localhost:5000';

async function req(path, options = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, body, headers: res.headers };
}

async function main() {
  const failures = [];
  const ok = (label, cond, detail = '') => {
    if (cond) console.log(`  OK  ${label}${detail ? ` — ${detail}` : ''}`);
    else {
      console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
      failures.push(label);
    }
  };

  console.log(`\nFigsApp — test API locale (${BASE})\n`);

  const health = await req('/api/health');
  ok('GET /api/health', health.status === 200 && health.body?.ok === true);

  const programmes = await req('/api/programmes-figs');
  ok(
    'GET /api/programmes-figs',
    programmes.status === 200 && programmes.body?.programs?.length > 0,
    `${programmes.body?.meta?.total ?? 0} programmes`
  );

  const niveaux = await req('/api/filieres/8/niveaux-disponibles');
  ok(
    'GET /api/filieres/8/niveaux-disponibles',
    niveaux.status === 200 && Array.isArray(niveaux.body?.niveaux),
    `${niveaux.body?.niveaux?.length ?? 0} niveaux`
  );

  const filieres = await req('/api/filieres?type=privee');
  ok(
    'GET /api/filieres',
    filieres.status === 200 && Array.isArray(filieres.body) && filieres.body.length > 0,
    `${filieres.body?.length ?? 0} filières`
  );

  const universites = await req('/api/universites');
  ok(
    'GET /api/universites',
    universites.status === 200 && Array.isArray(universites.body) && universites.body.length > 0,
    `${universites.body?.length ?? 0} universités`
  );

  const login = await req('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'admin@shoolapp.com', password: 'admin123' }),
  });
  ok('POST /api/admin/login', login.status === 200 && login.body?.admin?.email);

  const cookie = login.headers.getSetCookie?.()?.[0]?.split(';')[0]
    || (login.headers.get('set-cookie') || '').split(';')[0];
  if (cookie) {
    const me = await req('/api/admin/me', { headers: { Cookie: cookie } });
    ok('GET /api/admin/me', me.status === 200 && me.body?.admin?.email);
    const stats = await req('/api/admin/stats', { headers: { Cookie: cookie } });
    ok('GET /api/admin/stats', stats.status === 200);
  } else {
    ok('GET /api/admin/me', false, 'pas de cookie session');
  }

  console.log('');
  if (failures.length) {
    console.error(`Échecs: ${failures.join(', ')}`);
    console.error('→ Lancez scripts\\start-dev.bat puis npm run setup:neon si besoin.\n');
    process.exit(1);
  }
  console.log('Tous les tests API sont OK.\n');
  console.log('Site:  http://localhost:3001');
  console.log('Admin: http://localhost:3001/admin');
  console.log('      admin@shoolapp.com / admin123\n');
}

main().catch((err) => {
  console.error('API inaccessible:', err.message);
  console.error('→ Démarrez l\'API: npm run dev  ou  scripts\\start-dev.bat\n');
  process.exit(1);
});
