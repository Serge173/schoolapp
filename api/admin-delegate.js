'use strict';

let handlerPromise;

const DELEGATE_PATH_MAP = {
  '/api/admin-universites': '/api/admin/universites',
  '/api/admin-filieres-list': '/api/admin/filieres',
  '/api/admin-filieres-tree': '/api/admin/filieres/tree',
  '/api/admin-inscriptions': '/api/admin/inscriptions',
  '/api/admin-rendez-vous': '/api/admin/rendez-vous',
};

function normalizeDelegateUrl(req) {
  const url = new URL(req.url || '/', 'http://localhost');
  const mapped = DELEGATE_PATH_MAP[url.pathname];
  if (!mapped) return;
  const qs = url.searchParams.toString();
  req.url = qs ? `${mapped}?${qs}` : mapped;
}

module.exports = async (req, res) => {
  normalizeDelegateUrl(req);
  if (!handlerPromise) {
    handlerPromise = Promise.resolve().then(() => require('./admin'));
  }
  return handlerPromise(req, res);
};
