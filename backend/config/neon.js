'use strict';

const { neonConfig } = require('@neondatabase/serverless');

let configured = false;

/** Neon sur Vercel : fetch HTTP (pas de WebSocket/ws). En local : ws si dispo. */
function configureNeon() {
  if (configured) return;
  configured = true;

  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    neonConfig.poolQueryViaFetch = true;
    return;
  }

  try {
    neonConfig.webSocketConstructor = require('ws');
  } catch {
    neonConfig.poolQueryViaFetch = true;
  }
}

module.exports = { configureNeon };
