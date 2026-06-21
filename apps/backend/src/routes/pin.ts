import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// POST /api/exclusion/pin/set
router.post('/pin/set', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { pin } = req.body as { pin: string };
  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))
    return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits' });
  try {
    const hash = await bcrypt.hash(pin, 10);
    await pool.query(
      `INSERT INTO exclusion_profiles (user_id, pin_hash)
       VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET pin_hash = EXCLUDED.pin_hash, updated_at = NOW()`,
      [userId, hash],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to set PIN' });
  }
});

// POST /api/exclusion/pin/verify
router.post('/pin/verify', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { pin } = req.body as { pin: string };
  if (!pin) return res.status(400).json({ success: false, error: 'pin required' });
  try {
    const result = await pool.query(
      `SELECT pin_hash FROM exclusion_profiles WHERE user_id = $1`,
      [userId],
    );
    const profile = result.rows[0];
    if (!profile?.pin_hash)
      return res.status(404).json({ success: false, error: 'No PIN set' });
    const ok = await bcrypt.compare(pin, profile.pin_hash);
    if (!ok) return res.status(401).json({ success: false, error: 'Incorrect PIN' });
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'PIN verification failed' });
  }
});

export default router;
