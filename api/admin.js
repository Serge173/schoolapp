/**
 * Routes admin — handlers légers en premier, Express chargé uniquement si nécessaire.
 */
const { handleLiteAdmin } = require('../includes/liteAdminHandler');
const { withServerlessSecurity } = require('../includes/serverlessSecurity');

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
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const cookieParser = require('cookie-parser');
  const app = express();
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const isProd = process.env.NODE_ENV === 'production';
  const rateLimitDefaults = isVercel ? { validate: false } : {};

  app.set('trust proxy', 1);
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  }));
  app.use(cookieParser());

  const loginLimiter = rateLimit({
    ...rateLimitDefaults,
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Trop de tentatives de connexion. Réessayez plus tard.' },
  });
  app.use('/api/admin/login', loginLimiter);

  const adminLimiter = rateLimit({
    ...rateLimitDefaults,
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Trop de requêtes admin. Réessayez plus tard.' },
  });
  app.use('/api/admin', adminLimiter);

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

const innerHandler = async (req, res) => {
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

module.exports = withServerlessSecurity(innerHandler);
