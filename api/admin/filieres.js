const { requireAdmin } = require('../_authLite');
const { fetchAdminFilieresList } = require('../../includes/adminFilieresData');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    try {
      return res.status(200).json(await fetchAdminFilieresList());
    } catch (err) {
      console.error('[api/admin/filieres]', err);
      return res.status(500).json({ error: 'Erreur serveur.' });
    }
  }
  return require('../admin-delegate')(req, res);
};
