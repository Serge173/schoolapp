/**
 * GET /api/admin/me — handler léger (sans boot Express).
 */
const db = require('../config/db');
const { requireAdmin } = require('./_authLite');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;
  try {
    const [rows] = await db.query('SELECT id, email, nom FROM admins WHERE id = ?', [admin.id]);
    if (!rows.length) return res.status(401).json({ error: 'Session invalide.' });
    return res.status(200).json({ admin: rows[0] });
  } catch (err) {
    console.error('[api/admin-me]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
