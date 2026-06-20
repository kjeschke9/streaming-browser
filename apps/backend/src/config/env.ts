import 'dotenv/config';

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

export const env = {
  NODE_ENV:            process.env['NODE_ENV'] ?? 'development',
  PORT:                parseInt(process.env['PORT'] ?? '4000', 10),
  DATABASE_URL:        required('DATABASE_URL'),
  JWT_SECRET:          required('JWT_SECRET'),
  JWT_REFRESH_SECRET:  required('JWT_REFRESH_SECRET'),
  JWT_EXPIRES_IN:      process.env['JWT_EXPIRES_IN'] ?? '15m',
  JWT_REFRESH_EXPIRES: process.env['JWT_REFRESH_EXPIRES'] ?? '30d',
  CORS_ORIGIN:         process.env['CORS_ORIGIN'] ?? 'http://localhost:3000',
  BCRYPT_ROUNDS:       parseInt(process.env['BCRYPT_ROUNDS'] ?? '12', 10),
} as const;
