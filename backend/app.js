const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const filieresRouter = require('./routes/filieres');
const universitesRouter = require('./routes/universites');
const inscriptionsRouter = require('./routes/inscriptions');
const adminRouter = require('./routes/admin');
const contactRouter = require('./routes/contact');
const rendezVousRouter = require('./routes/rendez-vous');
const demandesOrientationRouter = require('./routes/demandes-orientation');
const programmesFigsRouter = require('./routes/programmes-figs');
const { uploadDir } = require('./middleware/upload');
const { requestLogger } = require('./middleware/requestLogger');
const { assertJwtSecretConfigured } = require('./utils/jwtSecret');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

if (isProd) assertJwtSecretConfigured();

if (isProd && !process.env.CORS_ORIGIN && !process.env.VERCEL) {
  throw new Error('CORS_ORIGIN must be configured in production.');
}

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      'img-src': ["'self'", 'data:', 'https:'],
      'script-src': ["'self'"],
      'connect-src': ["'self'", 'https:'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    },
  },
  hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

/** Accepte aussi la variante www / sans-www de chaque origine configurée. */
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
      /* ignore invalid URL */
    }
  }
  return [...set];
}

const corsOrigins = expandCorsOrigins(
  (process.env.CORS_ORIGIN || '').split(',').map((v) => v.trim()).filter(Boolean)
);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (!isProd) return cb(null, true);
    if (process.env.VERCEL && corsOrigins.length === 0) return cb(null, true);
    return cb(null, corsOrigins.includes(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '200kb' }));
app.use(requestLogger);

const inscriptionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});
app.use('/api/inscriptions', inscriptionLimiter);

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de messages. Réessayez plus tard.' },
});
const rdvLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Trop de demandes de rendez-vous. Réessayez plus tard.' },
});
const demandeOrientationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  message: { error: 'Trop de demandes. Réessayez plus tard.' },
});
app.use('/api/contact', contactLimiter, contactRouter);
app.use('/api/rendez-vous', rdvLimiter, rendezVousRouter);
app.use('/api/demandes-orientation', demandeOrientationLimiter, demandesOrientationRouter);

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes admin. Réessayez plus tard.' },
});

app.use('/uploads', (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(path.isAbsolute(uploadDir) ? uploadDir : path.join(__dirname, uploadDir), {
  fallthrough: false,
  maxAge: isProd ? '7d' : 0,
}));

app.use('/api/filieres', filieresRouter);
app.use('/api/universites', universitesRouter);
app.use('/api/programmes-figs', programmesFigsRouter);
app.use('/api/inscriptions', inscriptionsRouter);
app.use('/api/admin', adminLimiter, adminRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur serveur.' });
});

module.exports = app;
