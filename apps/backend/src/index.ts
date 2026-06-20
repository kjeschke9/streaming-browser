/**
 * Backend entry point (v3) — adds watchlist + titles routes.
 */
import 'dotenv/config';
import express      from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import compression  from 'compression';
import { rateLimit } from 'express-rate-limit';
import { logger }   from './utils/logger';
import { pool }     from './db/pool';

// Routes
import authRouter       from './routes/auth';
import servicesRouter   from './routes/services';
import exclusionRouter  from './routes/exclusion';
import searchRouter     from './routes/search';
import pinRouter        from './routes/pin';
import discoveryRouter  from './routes/discovery';
import syncStatusRouter from './routes/syncStatus';
import watchlistRouter  from './routes/watchlist';
import titlesRouter     from './routes/titles';

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ── Security / middleware ─────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin:      process.env.CORS_ORIGINS?.split(',') ?? [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 60_000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', db: 'disconnected' });
  }
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRouter);
app.use('/api/services',   servicesRouter);
app.use('/api/exclusion',  exclusionRouter);
app.use('/api/exclusion',  pinRouter);
app.use('/api/search',     searchRouter);
app.use('/api/discovery',  discoveryRouter);
app.use('/api/sync',       syncStatusRouter);
app.use('/api/watchlist',  watchlistRouter);
app.use('/api/titles',     titlesRouter);

// ── 404 + error handler ───────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Backend listening on port ${PORT}`);
});

export default app;
