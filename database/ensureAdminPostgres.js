const bcrypt = require('bcryptjs');

/**
 * Garantit qu'un compte admin existe (Neon/Vercel).
 */
async function ensureAdminPostgres(pool) {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    `INSERT INTO admins (email, password, nom) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
    ['admin@shoolapp.com', hash, 'Administrateur']
  );
}

module.exports = { ensureAdminPostgres };
