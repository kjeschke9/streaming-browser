import { Router } from 'express';
import { validate, loginSchema, registerSchema } from '../middleware/validate';
import * as authService from '../services/authService';

const router = Router();

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const tokens = await authService.registerUser(req.body.email, req.body.password, req.body.displayName);
    res.status(201).json({ ok: true, data: tokens });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    res.status(409).json({ ok: false, error: msg });
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const tokens = await authService.loginUser(req.body.email, req.body.password);
    res.json({ ok: true, data: tokens });
  } catch (err) {
    res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(400).json({ ok: false, error: 'refreshToken required' }); return; }
  try {
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ ok: true, data: tokens });
  } catch {
    res.status(401).json({ ok: false, error: 'Invalid or expired refresh token' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await authService.logoutUser(refreshToken);
  res.json({ ok: true, data: null });
});

export default router;
