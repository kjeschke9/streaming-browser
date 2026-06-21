import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const SUPPORTED_SERVICES = ['netflix','prime','hulu','disney','max','apple','peacock','paramount','crunchyroll'];

// GET /api/services
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    const result = await pool.query(
      `SELECT service_id, enabled FROM service_configs WHERE user_id = $1`,
      [userId],
    );
    const configured = result.rows.reduce((acc: any, r: any) => {
      acc[r.service_id] = r.enabled; return acc;
    }, {});
    const services = SUPPORTED_SERVICES.map(id => ({
      id,
      enabled: configured[id] ?? false,
    }));
    res.json({ success: true, services });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch services' });
  }
});

// PUT /api/services
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const { services } = req.body as { services: { id: string; enabled: boolean }[] };
  if (!Array.isArray(services))
    return res.status(400).json({ success: false, error: 'services array required' });

  try {
    for (const svc of services) {
      if (!SUPPORTED_SERVICES.includes(svc.id)) continue;
      await pool.query(
        `INSERT INTO service_configs (user_id, service_id, enabled)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, service_id) DO UPDATE SET enabled = EXCLUDED.enabled`,
        [userId, svc.id, svc.enabled],
      );
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to update services' });
  }
});

export default router;
