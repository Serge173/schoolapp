/**
 * Vérifie que le frontend prod est à jour (logo, CSS, popup inscription).
 * Usage: node scripts/verify-prod-frontend.js
 */
const BASE = process.env.SITE_BASE || 'https://figsappcotedivoire.com';
const MIN_LOGO_BYTES = 70000;
const OLD_CSS_HASHES = new Set(['CFdguPtV', 'CingZZYh']);

async function fetchText(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'Cache-Control': 'no-cache' } });
    const text = await res.text();
    return { status: res.status, text, headers: res.headers };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const failures = [];
  const ok = (label, cond, detail = '') => {
    console.log(`  ${cond ? 'OK' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
    if (!cond) failures.push(label);
  };

  console.log(`\n=== Vérification frontend (${BASE}) ===\n`);

  const home = await fetchText(`${BASE}/`);
  ok('GET accueil', home.status === 200, `HTTP ${home.status}`);

  const cssMatch = home.text.match(/assets\/index-([A-Za-z0-9_-]+)\.css/);
  const cssHash = cssMatch?.[1] || '';
  ok('CSS bundle récent', cssHash && !OLD_CSS_HASHES.has(cssHash), cssHash || 'introuvable');

  const jsMatch = home.text.match(/assets\/index-([A-Za-z0-9_-]+)\.js/);
  const jsHash = jsMatch?.[1] || '';
  ok('JS bundle présent', Boolean(jsHash), jsHash || 'introuvable');

  if (cssHash) {
    const css = await fetchText(`${BASE}/assets/index-${cssHash}.css`);
    ok('GET CSS', css.status === 200);
    ok('Fond blanc (header)', /layout-header[\s\S]*background:\s*#fff/i.test(css.text) || /\.layout-header\{[^}]*background:#fff/i.test(css.text.replace(/\s/g, '')));
  }

  if (jsHash) {
    const js = await fetchText(`${BASE}/assets/index-${jsHash}.js`);
    ok('GET JS', js.status === 200);
    ok('Popup inscription (validation)', js.text.includes('ins-validation-overlay') || js.text.includes('Champ obligatoire'));
  }

  const logo = await fetch(`${BASE}/images/figsapp-logo.jpg`, { method: 'HEAD' });
  const logoBytes = Number(logo.headers.get('content-length') || 0);
  ok('Logo FigsApp (nouveau fichier)', logo.status === 200 && logoBytes >= MIN_LOGO_BYTES, `${logoBytes} octets`);

  const icon = await fetch(`${BASE}/images/figsapp-icon-180.jpg`, { method: 'HEAD' });
  ok('Icône mobile', icon.status === 200 && Number(icon.headers.get('content-length') || 0) > 1000);

  if (failures.length) {
    console.log(`\n${failures.length} échec(s) — le déploiement Vercel « Production – frontend » est probablement en retard.`);
    console.log('Vercel → projet lié au domaine → Deployments → Redeploy le dernier commit master (sans cache).\n');
    process.exit(1);
  }

  console.log('\nFrontend prod à jour.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
