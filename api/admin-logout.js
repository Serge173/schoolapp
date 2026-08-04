/**
 * POST /api/admin/logout — handler léger (sans boot Express).
 */
const { writeAudit } = require('../includes/auditLog');
const { requireAdmin, clearAdminCookie } = require('./_authLite');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const admin = requireAdmin(req, res);
  if (!admin) return;
  clearAdminCookie(res);
  writeAudit('admin.logout', { adminId: admin.id, ip: getClientIp(req) });
  return res.status(200).json({ message: 'Déconnecté.' });
};
