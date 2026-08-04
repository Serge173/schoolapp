const serverless = require('serverless-http');
const { boot } = require('../server/_boot');
const { pathnameOf } = require('../includes/apiLite');

/** Routes gérées par d'autres fonctions — ne jamais booter Express (évite timeout 60s). */
const DELEGATED_PREFIXES = [
  '/api/admin',
  '/api/contact',
  '/api/inscriptions',
  '/api/rendez-vous',
  '/api/demandes-orientation',
  '/api/filieres',
  '/api/universites',
  '/api/programmes-figs',
  '/api/ping',
  '/api/health',
];

function isDelegatedApiPath(path) {
  return DELEGATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

let handlerPromise;

module.exports = async (req, res) => {
  const path = pathnameOf(req);
  if (isDelegatedApiPath(path)) {
    console.error('[api/server] route déléguée reçue par server.js:', path);
    return res.status(503).json({
      error: 'Service temporairement indisponible. Réessayez dans quelques instants.',
    });
  }

  if (!handlerPromise) {
    handlerPromise = boot().then((app) => serverless(app));
  }
  const handler = await handlerPromise;
  return handler(req, res);
};
