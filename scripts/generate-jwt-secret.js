// Genere un JWT_SECRET et affiche les etapes dashboard Vercel (sans CLI).
// Usage: node scripts/generate-jwt-secret.js

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const secret = crypto.randomBytes(48).toString('base64url');
const outFile = path.join(__dirname, '..', '.jwt-secret-setup.local');

fs.writeFileSync(outFile, `${secret}\n`, { mode: 0o600 });

console.log('');
console.log('=== JWT_SECRET genere (copiez depuis le fichier local) ===');
console.log('');
console.log('Fichier local (gitignore): .jwt-secret-setup.local');
console.log('');
console.log('Dashboard Vercel:');
console.log('  1. https://vercel.com/dashboard');
console.log('  2. Projet avec figsappcotedivoire.com (souvent "frontend")');
console.log('  3. Settings > Environment Variables');
console.log('  4. Add: JWT_SECRET = (valeur du fichier) | Production + Preview | Sensitive');
console.log('  5. Deployments > Redeploy (sans cache)');
console.log('');
console.log('Ou en CLI apres vercel login:');
console.log('  powershell -ExecutionPolicy Bypass -File scripts/setup-jwt-secret-vercel.ps1');
console.log('');
console.log('Supprimez .jwt-secret-setup.local apres configuration.');
