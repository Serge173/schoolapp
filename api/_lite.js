'use strict';

async function readJsonBody(req) {
  if (req.body != null && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  if (typeof req.body === 'string' && req.body.length) {
    return JSON.parse(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function pathnameOf(req) {
  const raw = req.url || '/';
  return raw.split('?')[0].replace(/\/+$/, '') || '/';
}

module.exports = { readJsonBody, pathnameOf };
