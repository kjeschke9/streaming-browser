/**
 * Backend: Push Notification Routes
 * POST /api/push/register  — save device token
 * DELETE /api/push/unregister — remove token on logout
 * POST /api/push/broadcast — admin: send push to all users (internal use)
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';

export function createPushRouter(pool: Pool): Router {
  const router = Router();

  // Ensure table exists (migration-safe check)
  pool.query(`
    CREATE TABLE IF NOT EXISTS push_tokens (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token       TEXT NOT NULL,
      platform    TEXT NOT NULL DEFAULT 'unknown',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, token)
    );
  `).catch(err => console.error('[push] Table init error:', err));

  /**
   * POST /api/push/register
   * Body: { token: string, platform: 'ios' | 'android' }
   */
  router.post('/register', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { token, platform = 'unknown' } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'token is required' });
    }

    try {
      await pool.query(
        `INSERT INTO push_tokens (user_id, token, platform)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, token) DO UPDATE SET platform = EXCLUDED.platform`,
        [userId, token, platform],
      );
      res.json({ ok: true });
    } catch (err) {
      console.error('[push] register error:', err);
      res.status(500).json({ error: 'Failed to register token' });
    }
  });

  /**
   * DELETE /api/push/unregister
   * Body: { token: string }
   */
  router.delete('/unregister', authenticateToken, async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { token } = req.body;

    if (!token) return res.status(400).json({ error: 'token is required' });

    try {
      await pool.query(
        `DELETE FROM push_tokens WHERE user_id = $1 AND token = $2`,
        [userId, token],
      );
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to unregister token' });
    }
  });

  /**
   * GET /api/push/tokens  (internal/admin — no auth for now, protect in prod)
   * Returns all tokens for a user — used by sync-worker to send new-title alerts.
   */
  router.get('/tokens/:userId', async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
      const result = await pool.query(
        `SELECT token, platform FROM push_tokens WHERE user_id = $1`,
        [userId],
      );
      res.json(result.rows);
    } catch {
      res.status(500).json({ error: 'Query failed' });
    }
  });

  return router;
}
