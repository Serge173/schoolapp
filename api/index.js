const { runStartupMigrations } = require('../backend/database/startupMigrations');

function loadApp() {
  try {
    return require('../backend/app');
  } catch (err) {
    const msg = err.message || String(err);
    if (msg.includes('JWT_SECRET')) {
      throw new Error('JWT_SECRET manquant sur Vercel (Settings → Environment Variables).');
    }
    throw err;
  }
}

const expressApp = loadApp();

let initPromise = runStartupMigrations().catch((err) => {
  console.error('[vercel-api] Startup failed:', err.message || err);
  throw err;
});

module.exports = (req, res) => {
  initPromise
    .then(() => expressApp(req, res))
    .catch((err) => {
      console.error('[vercel-api]', err);
      if (!res.headersSent) {
        res.status(500).json({
          error: err.message || 'Initialisation du service impossible.',
        });
      }
    });
};
