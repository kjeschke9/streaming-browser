import { Router, Request, Response } from 'express';
import { pool } from '../db/pool';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/discovery — returns content rails per enabled service
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  try {
    // Get user's enabled services
    const svcResult = await pool.query(
      `SELECT service_id FROM service_configs WHERE user_id = $1 AND enabled = true`,
      [userId],
    );
    const serviceIds: string[] = svcResult.rows.map((r: any) => r.service_id);

    if (serviceIds.length === 0) {
      return res.json({ success: true, rails: [] });
    }

    // Get exclusion profile
    const exclResult = await pool.query(
      `SELECT blocked_tags, allowed_ratings, safe_feed_mode FROM exclusion_profiles WHERE user_id = $1`,
      [userId],
    );
    const excl = exclResult.rows[0];
    const safeFeed = excl?.safe_feed_mode !== 'off';
    const blockedTags: string[] = excl?.blocked_tags ?? [];
    const allowedRatings: string[] = excl?.allowed_ratings ?? [];

    // Hidden title ids
    const hiddenResult = await pool.query(
      `SELECT title_id FROM hidden_titles WHERE user_id = $1`,
      [userId],
    );
    const hiddenIds: string[] = hiddenResult.rows.map((r: any) => r.title_id).filter(Boolean);

    // Build rails per service
    const rails: any[] = [];
    for (const svcId of serviceIds) {
      let q = `SELECT * FROM title_cache WHERE service_id = $1`;
      const params: any[] = [svcId];

      if (hiddenIds.length > 0) {
        q += ` AND id != ALL($${params.length + 1}::uuid[])`;
        params.push(hiddenIds);
      }
      if (safeFeed && blockedTags.length > 0) {
        q += ` AND NOT (tags && $${params.length + 1}::text[])`;
        params.push(blockedTags);
      }
      if (safeFeed && allowedRatings.length > 0) {
        q += ` AND rating = ANY($${params.length + 1}::text[])`;
        params.push(allowedRatings);
      }

      q += ` ORDER BY popularity DESC LIMIT 30`;

      const result = await pool.query(q, params);
      if (result.rows.length > 0) {
        rails.push({ serviceId: svcId, titles: result.rows });
      }
    }

    res.json({ success: true, rails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Discovery failed', detail: err.message });
  }
});

export default router;
