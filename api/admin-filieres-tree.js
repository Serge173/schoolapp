const { requireAdmin } = require('./_authLite');
const { fetchAdminFilieresTree } = require('../includes/adminFilieresData');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    try {
      return res.status(200).json(await fetchAdminFilieresTree());
    } catch (err) {
      console.error('[api/admin-filieres-tree]', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
  return require('./admin-delegate')(req, res);
};
