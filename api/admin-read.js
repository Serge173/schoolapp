/**
 * GET listes admin — handler léger unique (évite 20+ fonctions Vercel).
 * POST/PATCH/DELETE délégués vers api/admin.js
 */
const { requireAdmin } = require('./_authLite');
const { originalApiPath } = require('./_lite');
const { fetchAdminUniversitesList } = require('../includes/adminUniversitesList');
const { fetchAdminFilieresList, fetchAdminFilieresTree } = require('../includes/adminFilieresData');
const { fetchAdminInscriptionsList, fetchAdminRendezVousList } = require('../includes/adminLists');

const LITE_GET_PATHS = new Set([
  '/api/admin/universites',
  '/api/admin/filieres',
  '/api/admin/filieres/tree',
  '/api/admin/inscriptions',
  '/api/admin/rendez-vous',
]);

let delegatePromise;

async function delegateToAdminApp(req, res) {
  if (!delegatePromise) {
    delegatePromise = Promise.resolve().then(() => require('./admin'));
  }
  const handler = await delegatePromise;
  const apiPath = originalApiPath(req);
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.searchParams.has('__route')) {
    url.searchParams.delete('__route');
  }
  const qs = url.searchParams.toString();
  req.url = qs ? `${apiPath}?${qs}` : apiPath;
  return handler(req, res);
}

module.exports = async (req, res) => {
  const path = originalApiPath(req);
  if (!LITE_GET_PATHS.has(path) || req.method !== 'GET') {
    return delegateToAdminApp(req, res);
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    const query = Object.fromEntries(url.searchParams);
    if (path === '/api/admin/universites') {
      return res.status(200).json(await fetchAdminUniversitesList());
    }
    if (path === '/api/admin/filieres/tree') {
      return res.status(200).json(await fetchAdminFilieresTree());
    }
    if (path === '/api/admin/filieres') {
      return res.status(200).json(await fetchAdminFilieresList());
    }
    if (path === '/api/admin/inscriptions') {
      return res.status(200).json(await fetchAdminInscriptionsList(query));
    }
    if (path === '/api/admin/rendez-vous') {
      return res.status(200).json(await fetchAdminRendezVousList(query));
    }
    return res.status(404).json({ error: 'Route introuvable.' });
  } catch (err) {
    console.error('[api/admin-read]', path, err);
    if (String(err.message || '').includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
