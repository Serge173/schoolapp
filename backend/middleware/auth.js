const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../utils/jwtSecret');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '12h';
const ADMIN_COOKIE_NAME = process.env.ADMIN_COOKIE_NAME || 'sa_admin';

function getTokenFromRequest(req) {
  if (req.cookies && req.cookies[ADMIN_COOKIE_NAME]) return req.cookies[ADMIN_COOKIE_NAME];
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

exports.authenticate = (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ error: 'Accès non autorisé.' });
  }
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    req.adminId = decoded.id;
    req.adminEmail = decoded.email;
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

exports.generateToken = (admin) => {
  return jwt.sign({ id: admin.id, email: admin.email }, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
};

exports.ADMIN_COOKIE_NAME = ADMIN_COOKIE_NAME;
