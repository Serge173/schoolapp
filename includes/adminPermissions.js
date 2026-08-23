'use strict';

const { hasPermission, normalizeRole } = require('./adminRoles');

function forbidden(res, message = 'Action non autorisée pour votre rôle.') {
  return res.status(403).json({ error: message });
}

function requirePermission(permission) {
  return (req, res, next) => {
    const role = normalizeRole(req.adminRole);
    if (!hasPermission(role, permission)) {
      return forbidden(res);
    }
    return next();
  };
}

function checkPermission(role, permission) {
  return hasPermission(normalizeRole(role), permission);
}

module.exports = { requirePermission, checkPermission, forbidden };
