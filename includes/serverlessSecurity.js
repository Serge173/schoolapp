'use strict';

const { applySecurityHeaders } = require('./securityHeaders');

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
}

function withServerlessSecurity(handler) {
  return async (req, res) => {
    applySecurityHeaders(res);
    return handler(req, res);
  };
}

module.exports = { withServerlessSecurity, getClientIp };
