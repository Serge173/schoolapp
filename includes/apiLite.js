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

function cleanAdminQuery(query = {}) {
  const q = { ...query };
  delete q.__route;
  delete q.__path;
  return q;
}

function forwardedPathname(req) {
  const forwarded = req.headers['x-vercel-original-url'] || req.headers['x-forwarded-uri'];
  if (!forwarded) return null;
  try {
    const p = forwarded.startsWith('http') ? new URL(forwarded).pathname : forwarded.split('?')[0];
    return p ? p.replace(/\/+$/, '') || '/' : null;
  } catch {
    return null;
  }
}

/** Chemin API d'origine après rewrite Vercel (destination != source). */
function originalApiPath(req) {
  const forwarded = forwardedPathname(req);
  if (
    forwarded &&
    forwarded.startsWith('/api/') &&
    forwarded !== '/api/admin' &&
    forwarded !== '/api/filieres' &&
    forwarded.split('/').length >= 4
  ) {
    return forwarded;
  }

  const url = new URL(req.url || '/', 'http://localhost');
  let route = url.searchParams.get('__route');
  if (route) {
    if (route.includes(':id') && forwarded) {
      const idMatch = forwarded.match(/\/(\d+)(?:\/)?$/);
      if (idMatch) route = route.replace(':id', idMatch[1]);
    }
    if (route.startsWith('admin/')) {
      return `/api/${route}`.replace(/\/\/+/g, '/');
    }
    const entry = pathnameOf(req);
    if (entry === '/api/admin') {
      return `/api/admin/${route}`.replace(/\/\/+/g, '/');
    }
    if (entry === '/api/filieres' && PUBLIC_LITE_ROUTES.has(route)) {
      return `/api/${route}`;
    }
    if (PUBLIC_LITE_ROUTES.has(route)) {
      return `/api/${route}`;
    }
    return `/api/admin/${route}`.replace(/\/\/+/g, '/');
  }

  let path = pathnameOf(req);
  if (forwarded && (path === '/api/admin' || path === '/api/filieres')) {
    path = forwarded;
  } else {
    const needsForward =
      path === '/api/admin' ||
      path === '/api/filieres' ||
      (path.startsWith('/api/admin/') && path.split('/').length < 4);

    if (forwarded && needsForward) {
      path = forwarded;
    }
  }
  return path.replace(/\/+$/, '') || '/';
}

module.exports = { readJsonBody, pathnameOf, originalApiPath, cleanAdminQuery };
