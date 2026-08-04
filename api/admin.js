/**
 * Routes admin (hors login/me/logout/stats) — Express minimal sans boot complet.
 */
const serverless = require('serverless-http');
const express = require('express');
const cookieParser = require('cookie-parser');

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

let handlerPromise;

function createApp() {
  const app = express();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    if (isVercel && typeof req.body === 'string' && req.body.length) {
      try {
        req.body = JSON.parse(req.body);
        return next();
      } catch {
        return res.status(400).json({ error: 'JSON invalide.' });
      }
    }
    return express.json({ limit: process.env.JSON_BODY_LIMIT || '200kb' })(req, res, next);
  });
  const adminRouter = require('../server/routes/admin');
  app.use('/api/admin', adminRouter);
  app.use((err, req, res, next) => {
    console.error('[api/admin]', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erreur serveur.' });
  });
  return app;
}

module.exports = async (req, res) => {
  if (!handlerPromise) {
    handlerPromise = Promise.resolve().then(() => serverless(createApp()));
  }
  const handler = await handlerPromise;
  return handler(req, res);
};
