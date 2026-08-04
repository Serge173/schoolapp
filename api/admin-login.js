/**
 * POST /api/admin/login — handler léger (sans boot Express).
 */
require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken, ADMIN_COOKIE_NAME } = require('../server/middleware/auth');
const { writeAudit } = require('../includes/auditLog');
const { readJsonBody } = require('./_lite');

const isProd = process.env.NODE_ENV === 'production';

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Email invalide' });
    }
    if (password.length < 8 || password.length > 256) {
      return res.status(400).json({ error: 'Mot de passe invalide' });
    }

    const normalizedEmail = email.toLowerCase();
    const aliases = normalizedEmail === 'admin@schoolapp.com'
      ? ['admin@schoolapp.com', 'admin@shoolapp.com']
      : (normalizedEmail === 'admin@shoolapp.com'
        ? ['admin@shoolapp.com', 'admin@schoolapp.com']
        : [normalizedEmail]);
    const placeholders = aliases.map(() => '?').join(', ');
    const [rows] = await db.query(
      `SELECT id, email, password, nom FROM admins WHERE email IN (${placeholders}) ORDER BY id LIMIT 1`,
      aliases
    );
    if (!rows.length) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      return res.status(401).json({ error: 'Identifiants incorrects.' });
    }
    const token = generateToken(admin);
    const cookie = `${ADMIN_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${12 * 60 * 60}${isProd ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', cookie);
    writeAudit('admin.login.success', { adminId: admin.id, email: admin.email, ip: getClientIp(req) });
    return res.status(200).json({ admin: { id: admin.id, email: admin.email, nom: admin.nom } });
  } catch (err) {
    console.error('[api/admin-login]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};
