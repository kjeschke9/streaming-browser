export const env = {
  port:        parseInt(process.env.PORT ?? '4000', 10),
  jwtSecret:   process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  jwtExpiry:   process.env.JWT_EXPIRY  ?? '7d',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:19006,http://localhost:5173').split(','),
  tmdbKey:     process.env.TMDB_API_KEY ?? '',
  nodeEnv:     process.env.NODE_ENV ?? 'development',
};
