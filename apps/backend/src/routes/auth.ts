import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY ?? '7d';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, username, password } = req.body as Record<string, string>;
  if (!email || !username || !password)
    return res.status(400).json({ success: false, error: 'email, username, and password required' });

  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3) RETURNING id, email, username, created_at`,
      [email.toLowerCase(), username, hash],
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({ success: true, token, user: { id: user.id, email: user.email, username: user.username } });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ success: false, error: 'Email or username already taken' });
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as Record<string, string>;
  if (!email || !password)
    return res.status(400).json({ success: false, error: 'email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({ success: true, token, user: { id: user.id, email: user.email, username: user.username } });
  } catch {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const result = await pool.query('SELECT id, email, username, created_at FROM users WHERE id = $1', [userId]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

export default router;
