const { requireAdmin } = require('./_authLite');
const { fetchAdminInscriptionsList } = require('../includes/adminLists');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      const query = Object.fromEntries(url.searchParams);
      return res.status(200).json(await fetchAdminInscriptionsList(query));
    } catch (err) {
      console.error('[api/admin-inscriptions]', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
  return require('./admin-delegate')(req, res);
};
