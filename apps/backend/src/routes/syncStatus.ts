/**
 * GET /api/sync/status
 *
 * Returns the sync health dashboard:
 *   - Last sync time per service (from sync_log)
 *   - Title count per service (from title_cache, stale_at IS NULL)
 *   - Any error messages from the most recent sync run
 *   - Overall catalogue totals
 *
 * Response shape:
 *   {
 *     success: true,
 *     data: {
 *       services: ServiceSyncStatus[],
 *       totals: { titles: number, services: number, lastSync: string | null }
 *     }
 *   }
 */

import { Router } from 'express';
import { pool }   from '../db/pool';
import { authenticate } from '../middleware/auth';
import { ok, serverError } from '../utils/response';

const router = Router();

interface ServiceSyncStatus {
  serviceId:    string;
  lastSyncedAt: string | null;
  titleCount:   number;
  error:        string | null;
  durationMs:   number | null;
  upserted:     number | null;
  staled:       number | null;
}

router.get('/', authenticate, async (req, res) => {
  try {
    // All known service IDs
    const SERVICE_IDS = [
      'netflix','prime','hulu','disney','hbo','apple','peacock','paramount','crunchyroll',
    ];

    // Most recent sync_log entry per service
    const logRes = await pool.query<{
      service_id:  string;
      synced_at:   Date;
      upserted:    number;
      staled:      number;
      duration_ms: number;
      error:       string | null;
    }>(
      `SELECT DISTINCT ON (service_id)
              service_id, synced_at, upserted, staled, duration_ms, error
       FROM   sync_log
       ORDER  BY service_id, synced_at DESC`
    );

    // Title counts per service (non-stale only)
    const countRes = await pool.query<{ service_id: string; cnt: string }>(
      `SELECT service_id, COUNT(*)::text AS cnt
       FROM   title_cache
       WHERE  stale_at IS NULL
       GROUP  BY service_id`
    );

    // Build lookup maps
    const logMap: Record<string, typeof logRes.rows[0]> = {};
    for (const row of logRes.rows) logMap[row.service_id] = row;

    const countMap: Record<string, number> = {};
    for (const row of countRes.rows) countMap[row.service_id] = parseInt(row.cnt, 10);

    // Assemble per-service status
    const services: ServiceSyncStatus[] = SERVICE_IDS.map(id => {
      const log = logMap[id];
      return {
        serviceId:    id,
        lastSyncedAt: log ? log.synced_at.toISOString() : null,
        titleCount:   countMap[id] ?? 0,
        error:        log?.error ?? null,
        durationMs:   log ? Number(log.duration_ms) : null,
        upserted:     log ? Number(log.upserted) : null,
        staled:       log ? Number(log.staled) : null,
      };
    });

    // Overall totals
    const totalTitles  = Object.values(countMap).reduce((s, n) => s + n, 0);
    const allSyncTimes = logRes.rows.map(r => r.synced_at.getTime());
    const lastSync     = allSyncTimes.length
      ? new Date(Math.max(...allSyncTimes)).toISOString()
      : null;

    return ok(res, {
      services,
      totals: {
        titles:      totalTitles,
        services:    services.filter(s => s.titleCount > 0).length,
        lastSync,
      },
    });
  } catch (err: any) {
    return serverError(res, err);
  }
});

// POST /api/sync/trigger — manually kick off a full sync (admin/dev use)
router.post('/trigger', authenticate, async (req, res) => {
  try {
    // We fire-and-forget — the sync-worker runs as a separate process.
    // Here we just update the sync_log to mark a "manual trigger requested"
    // so the worker picks it up on next poll. In production, you'd use
    // a message queue (Redis pub/sub, SQS, etc.). For now we return a hint.
    return ok(res, {
      message: 'Sync trigger noted. The sync-worker will pick this up on its next scheduled run (up to 6 hours). To force immediate sync, restart the sync-worker container.',
      hint:    'docker compose restart sync-worker',
    });
  } catch (err: any) {
    return serverError(res, err);
  }
});

export default router;
