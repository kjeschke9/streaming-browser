import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/watchlist
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const result = await pool.query(
      `SELECT w.id, w.added_at, t.*
       FROM watchlist w
       JOIN title_cache t ON t.id = w.title_id
       WHERE w.user_id = $1
       ORDER BY w.added_at DESC`,
      [userId],
    );
    res.json({ success: true, data: result.rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to fetch watchlist', detail: err.message });
  }
});

// POST /api/watchlist
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { title_id } = req.body as { title_id: string };
  if (!title_id) return res.status(400).json({ success: false, error: 'title_id required' });
  try {
    await pool.query(
      `INSERT INTO watchlist (user_id, title_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, title_id],
    );
    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to add to watchlist', detail: err.message });
  }
});

// DELETE /api/watchlist/:titleId
router.delete('/:titleId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { titleId } = req.params;
  try {
    await pool.query(`DELETE FROM watchlist WHERE user_id = $1 AND title_id = $2`, [userId, titleId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to remove from watchlist' });
  }
});

export default router;
