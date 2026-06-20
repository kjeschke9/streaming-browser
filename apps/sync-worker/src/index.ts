/**
 * Sync-worker entry point.
 *
 * Modes:
 *   NODE_ENV=production → starts CronScheduler + runs an immediate full sync on boot
 *   SYNC_ONCE=true      → runs one full sync then exits (useful for CI / k8s Jobs)
 *   default (dev)       → runs one full sync then starts scheduler
 *
 * Adapter selection (per service, checked in order):
 *   1. TMDB_API_KEY set → TmdbAdapter (real data from themoviedb.org)
 *   2. fallback          → MockAdapter (fictional data, no network needed)
 *
 * TMDB adapter modes per service:
 *   netflix, hbo, apple, peacock, paramount → 'trending'
 *   prime, hulu                             → 'movie'
 *   disney, crunchyroll                     → 'tv'
 */
import 'dotenv/config';
import { pool }           from './db/pool';
import { logger }         from './utils/logger';
import { MockAdapter }    from './adapters/MockAdapter';
import { TmdbAdapter }    from './adapters/TmdbAdapter';
import { SyncEngine }     from './scheduler/SyncEngine';
import { CronScheduler }  from './scheduler/CronScheduler';
import type { ServiceId } from '@streaming/types';

const SERVICE_IDS: ServiceId[] = [
  'netflix','prime','hulu','disney','hbo','apple','peacock','paramount','crunchyroll',
];

// TMDB mode assignment per service
const TMDB_MODES: Record<ServiceId, 'trending' | 'movie' | 'tv'> = {
  netflix:    'trending',
  prime:      'movie',
  hulu:       'movie',
  disney:     'tv',
  hbo:        'trending',
  apple:      'trending',
  peacock:    'trending',
  paramount:  'trending',
  crunchyroll:'tv',
};

function buildAdapters() {
  const tmdbKey = process.env.TMDB_API_KEY;

  if (tmdbKey) {
    logger.info('TMDB_API_KEY detected — using TmdbAdapter for all services');
    return SERVICE_IDS.map(id => new TmdbAdapter(id, tmdbKey, TMDB_MODES[id]));
  }

  logger.info('No TMDB_API_KEY found — using MockAdapter (set TMDB_API_KEY for live data)');
  return SERVICE_IDS.map(id => new MockAdapter(id));
}

async function main() {
  logger.info('StreamHub Sync Worker starting…');

  // Verify DB connection
  try {
    await pool.query('SELECT 1');
    logger.info('Database connection OK');
  } catch (err: any) {
    logger.error('Cannot connect to database: ' + err.message);
    process.exit(1);
  }

  const adapters  = buildAdapters();
  const engine    = new SyncEngine();
  const scheduler = new CronScheduler(adapters);

  // Always run an immediate sync on startup
  logger.info('Running initial sync on startup…');
  const results = await engine.syncAll(adapters);
  const total   = results.reduce((s, r) => s + r.upserted, 0);
  const errors  = results.filter(r => r.error).length;
  logger.info(`Initial sync complete — ${total} titles across ${adapters.length} services (${errors} errors)`);

  if (process.env.SYNC_ONCE === 'true') {
    logger.info('SYNC_ONCE=true — exiting after single run');
    await pool.end();
    process.exit(0);
  }

  // Start periodic scheduler
  scheduler.start();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal} — shutting down scheduler`);
    scheduler.stop();
    await pool.end();
    process.exit(0);
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  logger.info('Sync worker running. Press Ctrl+C to stop.');
}

main().catch(err => {
  logger.error('Fatal error in sync worker', err);
  process.exit(1);
});
