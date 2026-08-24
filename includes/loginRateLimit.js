'use strict';

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX = 20;
const buckets = new Map();

function prune(windowMs) {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.start > windowMs) buckets.delete(key);
  }
}

/**
 * Limite par clé (IP) — mémoire locale de l'instance serverless.
 */
function allowRequest(key, max = LOGIN_MAX, windowMs = DEFAULT_WINDOW_MS) {
  prune(windowMs);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return bucket.count <= max;
}

function rateLimitMessage(custom) {
  return { error: custom || 'Trop de demandes. Réessayez plus tard.' };
}

module.exports = {
  allowRequest,
  rateLimitMessage,
  DEFAULT_WINDOW_MS,
  LOGIN_MAX,
};
