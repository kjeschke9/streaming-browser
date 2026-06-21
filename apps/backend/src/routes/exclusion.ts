import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/exclusion/profile
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const result = await pool.query(
      `SELECT safe_feed_mode, allowed_ratings, blocked_tags, show_badge FROM exclusion_profiles WHERE user_id = $1`,
      [userId],
    );
    res.json({ success: true, profile: result.rows[0] ?? null });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch exclusion profile' });
  }
});

// PUT /api/exclusion/profile
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { safe_feed_mode, allowed_ratings, blocked_tags, show_badge } = req.body;
  try {
    await pool.query(
      `INSERT INTO exclusion_profiles (user_id, safe_feed_mode, allowed_ratings, blocked_tags, show_badge)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (user_id) DO UPDATE SET
         safe_feed_mode = EXCLUDED.safe_feed_mode,
         allowed_ratings = EXCLUDED.allowed_ratings,
         blocked_tags = EXCLUDED.blocked_tags,
         show_badge = EXCLUDED.show_badge,
         updated_at = NOW()`,
      [userId, safe_feed_mode ?? 'off', allowed_ratings ?? [], blocked_tags ?? [], show_badge ?? true],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update exclusion profile' });
  }
});

// POST /api/exclusion/hidden
router.post('/hidden', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { title_id } = req.body as { title_id: string };
  if (!title_id) return res.status(400).json({ success: false, error: 'title_id required' });
  try {
    await pool.query(
      `INSERT INTO hidden_titles (user_id, title_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, title_id],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to hide title' });
  }
});

// GET /api/exclusion/hidden
router.get('/hidden', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const result = await pool.query(
      `SELECT h.id, h.hidden_at, t.title, t.poster_url, t.service_id FROM hidden_titles h
       LEFT JOIN title_cache t ON t.id = h.title_id WHERE h.user_id = $1 ORDER BY h.hidden_at DESC`,
      [userId],
    );
    res.json({ success: true, data: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch hidden titles' });
  }
});

// DELETE /api/exclusion/hidden/:titleId
router.delete('/hidden/:titleId', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { titleId } = req.params;
  try {
    await pool.query(`DELETE FROM hidden_titles WHERE user_id = $1 AND title_id = $2`, [userId, titleId]);
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to unhide title' });
  }
});

export default router;
