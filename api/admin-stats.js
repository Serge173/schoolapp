/**
 * GET /api/admin/stats — handler léger (sans boot Express).
 */
const { fetchAdminStats } = require('../includes/adminStats');
const { requireAdmin } = require('./_authLite');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    return res.status(200).json(await fetchAdminStats());
  } catch (err) {
    console.error('[api/admin-stats]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
