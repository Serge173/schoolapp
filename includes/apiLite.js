'use strict';

async function readJsonBody(req) {
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString('utf8'));
  }
  if (req.body != null && typeof req.body === 'object') {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.length) {
    return JSON.parse(req.body);
  }
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text ? JSON.parse(text) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function pathnameOf(req) {
  const raw = req.url || '/';
  return raw.split('?')[0].replace(/\/+$/, '') || '/';
}

const PUBLIC_LITE_ROUTES = new Set([
  'contact',
  'inscriptions',
  'rendez-vous',
  'demandes-orientation',
]);

/** Chemin API d'origine après rewrite Vercel (destination != source). */
function originalApiPath(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  const route = url.searchParams.get('__route');
  if (route) {
    if (PUBLIC_LITE_ROUTES.has(route)) {
      return `/api/${route}`;
    }
    return `/api/admin/${route}`.replace(/\/\/+/g, '/');
  }

  let path = pathnameOf(req);
  const forwarded = req.headers['x-vercel-original-url'] || req.headers['x-forwarded-uri'];
  const needsForward =
    path === '/api/health' ||
    path === '/api/admin' ||
    (path.startsWith('/api/admin/') && path.split('/').length < 4);

  if (forwarded && needsForward) {
    try {
      const p = forwarded.startsWith('http') ? new URL(forwarded).pathname : forwarded.split('?')[0];
      if (p && p.startsWith('/api/')) {
        path = p.replace(/\/+$/, '') || '/';
      }
    } catch {
      /* ignore */
    }
  }
  return path;
}

module.exports = { readJsonBody, pathnameOf, originalApiPath };
