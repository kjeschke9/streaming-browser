/**
 * GET /api/titles/:id — fetch a single title by its internal UUID.
 * Used by TitleDetailScreen when only the ID is known (e.g. from a push notification).
 */

import { Router }          from 'express';
import { pool }            from '../db/pool';
import { authenticate }    from '../middleware/auth';
import { ok, serverError, notFound } from '../utils/response';

const router = Router();

router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM title_cache WHERE id = $1 AND stale_at IS NULL`,
      [id]
    );
    if (!rows.length) return notFound(res, 'Title');

    const row = rows[0];
    const title = {
      id:          row.id,
      externalId:  row.external_id,
      serviceId:   row.service_id,
      title:       row.title,
      description: row.description ?? '',
      type:        row.type,
      genres:      row.genres ?? [],
      tags:        row.tags ?? [],
      rating:      row.rating,
      year:        row.year,
      duration:    row.duration_minutes ?? undefined,
      seasons:     row.seasons ?? undefined,
      posterUrl:   row.poster_url,
      backdropUrl: row.backdrop_url ?? undefined,
      deepLink:    row.deep_link,
      popularity:  row.popularity ?? 0,
      addedAt:     (row.created_at ?? new Date()).toISOString(),
    };
    return ok(res, { title });
  } catch (err: any) {
    return serverError(res, err);
  }
});

export default router;
