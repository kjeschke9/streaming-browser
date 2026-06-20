/**
 * Watchlist route — POST /api/watchlist, GET /api/watchlist, DELETE /api/watchlist/:titleId
 *
 * Simple per-user bookmark list stored in a watchlist table.
 * The SQL to create the table is in deploy/postgres/init.sql (appended below migration note).
 */

import { Router }           from 'express';
import { pool }             from '../db/pool';
import { authenticate }     from '../middleware/auth';
import { ok, serverError, notFound } from '../utils/response';

const router = Router();

// GET /api/watchlist — list all bookmarked titles
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const { rows } = await pool.query(
      `SELECT wl.id, wl.title_id, wl.added_at,
              tc.title, tc.poster_url, tc.service_id, tc.year, tc.rating, tc.type
       FROM   watchlist wl
       JOIN   title_cache tc ON tc.id = wl.title_id
       WHERE  wl.user_id = $1
       ORDER  BY wl.added_at DESC`,
      [userId]
    );
    return ok(res, { watchlist: rows });
  } catch (err: any) {
    return serverError(res, err);
  }
});

// POST /api/watchlist — add a title
router.post('/', authenticate, async (req, res) => {
  try {
    const userId  = (req as any).userId as string;
    const { titleId } = req.body as { titleId: string };
    if (!titleId) return res.status(400).json({ success: false, error: 'titleId required' });

    // Upsert so double-adding is idempotent
    const { rows } = await pool.query(
      `INSERT INTO watchlist (user_id, title_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, title_id) DO NOTHING
       RETURNING *`,
      [userId, titleId]
    );
    return ok(res, { item: rows[0] ?? null });
  } catch (err: any) {
    return serverError(res, err);
  }
});

// DELETE /api/watchlist/:titleId — remove a bookmark
router.delete('/:titleId', authenticate, async (req, res) => {
  try {
    const userId  = (req as any).userId as string;
    const { titleId } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM watchlist WHERE user_id = $1 AND title_id = $2`,
      [userId, titleId]
    );
    if (!rowCount) return notFound(res, 'Watchlist entry');
    return ok(res, { removed: true });
  } catch (err: any) {
    return serverError(res, err);
  }
});

export default router;
