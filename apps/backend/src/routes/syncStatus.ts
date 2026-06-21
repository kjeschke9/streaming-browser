import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/sync/status
router.get('/status', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT service_id, started_at, finished_at, status, titles_added, error_msg
       FROM sync_runs
       WHERE (service_id, started_at) IN (
         SELECT service_id, MAX(started_at) FROM sync_runs GROUP BY service_id
       )
       ORDER BY service_id`,
    );
    res.json({ success: true, runs: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch sync status', detail: err.message });
  }
});

export default router;
