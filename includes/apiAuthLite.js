'use strict';

require('../config/ensureJwtSecretEnv').ensureJwtSecretEnv();

const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtSecret');
const { ADMIN_COOKIE_NAME } = require('../server/middleware/auth');

function parseCookies(req) {
  const out = {};
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1);
    out[key] = decodeURIComponent(val);
  }
  return out;
}

function getTokenFromRequest(req) {
  const cookies = parseCookies(req);
  if (cookies[ADMIN_COOKIE_NAME]) return cookies[ADMIN_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) return authHeader.slice(7);
  return null;
}

function verifyAdmin(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return { id: decoded.id, email: decoded.email, role: decoded.role || 'admin' };
  } catch {
    return null;
  }
}

function requireAdmin(req, res) {
  const admin = verifyAdmin(req);
  if (!admin) {
    res.status(401).json({ error: 'Accès non autorisé.' });
    return null;
  }
  return admin;
}

function clearAdminCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isProd ? '; Secure' : ''}`
  );
}

module.exports = {
  ADMIN_COOKIE_NAME,
  parseCookies,
  getTokenFromRequest,
  verifyAdmin,
  requireAdmin,
  clearAdminCookie,
};
