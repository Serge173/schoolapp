require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('@neondatabase/serverless');

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
