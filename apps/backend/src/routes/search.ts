import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/search?q=&service=&type=
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const q      = ((req.query['q'] as string) ?? '').trim();
  const service = req.query['service'] as string | undefined;
  const type    = req.query['type']    as string | undefined;

  if (!q) return res.status(400).json({ success: false, error: 'q is required' });

  try {
    const params: any[] = [`%${q}%`];
    let sql = `SELECT t.* FROM title_cache t WHERE (t.title ILIKE $1 OR t.description ILIKE $1)`;

    // Restrict to user's enabled services
    const svcResult = await pool.query(
      `SELECT service_id FROM service_configs WHERE user_id = $1 AND enabled = true`,
      [userId],
    );
    const enabledServices: string[] = svcResult.rows.map((r: any) => r.service_id);
    if (enabledServices.length > 0) {
      params.push(enabledServices);
      sql += ` AND t.service_id = ANY($${params.length}::text[])`;
    }

    if (service) {
      params.push(service);
      sql += ` AND t.service_id = $${params.length}`;
    }
    if (type) {
      params.push(type);
      sql += ` AND t.type = $${params.length}`;
    }

    sql += ` ORDER BY t.popularity DESC LIMIT 40`;

    const result = await pool.query(sql, params);
    res.json({ success: true, results: result.rows, total: result.rowCount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Search failed', detail: err.message });
  }
});

export default router;
