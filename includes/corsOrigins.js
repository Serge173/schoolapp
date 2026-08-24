'use strict';

const DEFAULT_PROD_ORIGINS = [
  'https://figsappcotedivoire.com',
  'https://www.figsappcotedivoire.com',
];

function expandCorsOrigins(origins) {
  const set = new Set(origins);
  for (const origin of origins) {
    try {
      const u = new URL(origin);
      const host = u.hostname;
      const base = `${u.protocol}//`;
      const port = u.port ? `:${u.port}` : '';
      if (host.startsWith('www.')) {
        set.add(`${base}${host.slice(4)}${port}`);
      } else {
        set.add(`${base}www.${host}${port}`);
      }
    } catch {
      /* ignore */
    }
  }
  return [...set];
}

function getAllowedCorsOrigins() {
  const fromEnv = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  const extras = [];
  const siteBase = (process.env.SITE_BASE || '').trim();
  if (siteBase) extras.push(siteBase.replace(/\/$/, ''));
  const vercelUrl = (process.env.VERCEL_URL || '').trim();
  if (vercelUrl) extras.push(`https://${vercelUrl.replace(/\/$/, '')}`);

  const merged = [...fromEnv, ...extras, ...DEFAULT_PROD_ORIGINS];
  return expandCorsOrigins(merged);
}

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (process.env.NODE_ENV !== 'production') return true;
  return getAllowedCorsOrigins().includes(origin);
}

module.exports = { getAllowedCorsOrigins, isOriginAllowed, expandCorsOrigins, DEFAULT_PROD_ORIGINS };
