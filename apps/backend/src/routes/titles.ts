import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/titles/:id
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`SELECT * FROM title_cache WHERE id = $1`, [id]);
    if (!result.rows[0]) return res.status(404).json({ success: false, error: 'Title not found' });
    res.json({ success: true, title: result.rows[0] });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch title' });
  }
});

// GET /api/titles?service=&type=&limit=
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const service = req.query['service'] as string | undefined;
  const type    = req.query['type']    as string | undefined;
  const limit   = Math.min(parseInt(req.query['limit'] as string ?? '50', 10), 100);
  const params: any[] = [];
  let sql = `SELECT * FROM title_cache WHERE 1=1`;
  if (service) { params.push(service); sql += ` AND service_id = $${params.length}`; }
  if (type)    { params.push(type);    sql += ` AND type = $${params.length}`; }
  sql += ` ORDER BY popularity DESC LIMIT ${limit}`;
  try {
    const result = await pool.query(sql, params);
    res.json({ success: true, titles: result.rows });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch titles' });
  }
});

export default router;
