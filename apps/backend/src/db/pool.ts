import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER ?? 'streamhub'}:${process.env.DB_PASSWORD ?? 'streamhub_secret'}@${process.env.DB_HOST ?? 'localhost'}:${process.env.DB_PORT ?? '5432'}/${process.env.DB_NAME ?? 'streamhub'}`;

export const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('[pool] Unexpected client error', err.message);
});
