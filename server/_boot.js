const crypto = require('crypto');

(function ensureJwtSecretBeforeBoot() {
  if ((process.env.JWT_SECRET || '').trim()) return;
  const dbUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (dbUrl) {
    process.env.JWT_SECRET = crypto
      .createHash('sha256')
      .update(`${dbUrl}:figsapp-jwt-v1`)
      .digest('hex');
    return;
  }
  const host = process.env.PGHOST || process.env.POSTGRES_HOST;
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const password = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const database = process.env.PGDATABASE || process.env.POSTGRES_DATABASE;
  if (host && user && password && database) {
    const built = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}/${database}?sslmode=require`;
    process.env.JWT_SECRET = crypto
      .createHash('sha256')
      .update(`${built}:figsapp-jwt-v1`)
      .digest('hex');
  }
})();

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const { runStartupMigrations } = require('../database/startupMigrations');

let expressApp;
let initPromise;
let bootError;

function isRetriableBootError(err) {
  const msg = err?.message || '';
  return msg.includes('JWT_SECRET') || msg.includes('CORS_ORIGIN');
}

function boot() {
  if (bootError) {
    if (!isRetriableBootError(bootError)) return Promise.reject(bootError);
    bootError = undefined;
    initPromise = undefined;
    expressApp = undefined;
  }
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const app = require('./app');
        await runStartupMigrations();
        expressApp = app;
      } catch (err) {
        bootError = err;
        throw err;
      }
    })();
  }
  return initPromise;
}

function handleExpress(req, res) {
  boot()
    .then(() => expressApp(req, res))
    .catch((err) => {
      console.error('[vercel-api]', err);
      if (!res.headersSent) {
        const msg = err.message || 'Initialisation du service impossible.';
        res.status(500).json({ error: msg });
      }
    });
}

module.exports = { boot, handleExpress };
