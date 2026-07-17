const path = require('path');
if (process.env.DOTENV_CONFIG_PATH) {
  require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH, override: true });
}
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}
const bcrypt = require('bcryptjs');
const { Pool, neonConfig } = require('@neondatabase/serverless');

if (!process.env.VERCEL) {
  try {
    neonConfig.webSocketConstructor = require('ws');
  } catch {
    neonConfig.poolQueryViaFetch = true;
  }
}

async function seed() {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('DATABASE_URL ou POSTGRES_URL requis.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });
  const hash = await bcrypt.hash('admin123', 10);

  await pool.query(
    `INSERT INTO admins (email, password, nom) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password`,
    ['admin@shoolapp.com', hash, 'Administrateur']
  );

  console.log('Admin créé: admin@shoolapp.com / admin123');
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
