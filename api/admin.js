/**
 * Routes admin — handlers légers en premier, Express chargé uniquement si nécessaire.
 */
const { handleLiteAdmin } = require('../includes/liteAdminHandler');

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

let handlerPromise;

function restoreReqUrl(req) {
  const { originalApiPath } = require('../includes/apiLite');
  const path = originalApiPath(req);
  if (!path || !path.startsWith('/api/')) return;
  const url = new URL(req.url || '/', 'http://localhost');
  const extra = new URLSearchParams(url.search);
  extra.delete('__route');
  extra.delete('__path');
  const qs = extra.toString();
  req.url = path + (qs ? `?${qs}` : '');
}

function createExpressHandler() {
  const serverless = require('serverless-http');
  const express = require('express');
  const cookieParser = require('cookie-parser');
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
  return serverless(app);
}

module.exports = async (req, res) => {
  try {
    if (await handleLiteAdmin(req, res)) return;

    if (!handlerPromise) {
      handlerPromise = Promise.resolve().then(() => createExpressHandler());
    }
    restoreReqUrl(req);
    const handler = await handlerPromise;
    return handler(req, res);
  } catch (err) {
    console.error('[api/admin] handler', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
};
