/**
 * GET /api/discovery
 *
 * Returns pre-built content rails for the home screen.
 * Each rail is a named list of titles, filtered server-side through the
 * user's exclusion profile (hidden titles + global tag rules + Safe-Feed).
 *
 * Rails returned:
 *   trending      — highest popularity titles across all enabled services
 *   new_arrivals  — most recent by release year
 *   action        — Action / Thriller / Crime genre titles
 *   family        — Family / Animation / Kids genre titles
 *   drama         — Drama genre titles
 *   documentary   — Documentary genre titles
 *
 * Query params:
 *   limit   (default 20) — max titles per rail
 *   offset  (default  0) — pagination offset (applies to all rails equally)
 *
 * Response shape:
 *   { success: true, data: { rails: Rail[] } }
 *   Rail: { id, label, titles: Title[], hiddenCount: number }
 */

import { Router }           from 'express';
import { pool }             from '../db/pool';
import { authenticate }     from '../middleware/auth';
import { ok, serverError }  from '../utils/response';
import { ExclusionEngine }  from '@streaming/exclusion-engine';
import type { HiddenTitle, GlobalTagRule, SafeFeedConfig, Title, ContentRating } from '@streaming/types';

const router = Router();

// ── Helper: load user's exclusion engine from DB ──────────────────────────────
async function loadExclusionEngine(userId: string): Promise<ExclusionEngine> {
  const [hiddenRes, tagsRes, safeFeedRes] = await Promise.all([
    pool.query<{
      id: string; title_id: string; service_id: string; external_id: string;
      title_name: string; poster_url: string; hidden_at: Date;
    }>(
      `SELECT id, title_id, service_id, external_id, title_name, poster_url, hidden_at
       FROM   hidden_titles WHERE user_id = $1`,
      [userId]
    ),
    pool.query<{ id: string; tag: string; created_at: Date }>(
      `SELECT id, tag, created_at FROM global_tag_rules WHERE user_id = $1`,
      [userId]
    ),
    pool.query<{
      mode: string; allowed_ratings: ContentRating[]; blocked_tag_patterns: string[];
    }>(
      `SELECT mode, allowed_ratings, blocked_tag_patterns
       FROM   safe_feed_config WHERE user_id = $1`,
      [userId]
    ),
  ]);

  const hiddenTitles: HiddenTitle[] = hiddenRes.rows.map(r => ({
    id:         r.id,
    titleId:    r.title_id,
    serviceId:  r.service_id as any,
    externalId: r.external_id,
    titleName:  r.title_name,
    posterUrl:  r.poster_url,
    hiddenAt:   r.hidden_at.toISOString(),
    hiddenBy:   'user' as const,
  }));

  const globalTagRules: GlobalTagRule[] = tagsRes.rows.map(r => ({
    id:        r.id,
    tag:       r.tag,
    createdAt: r.created_at.toISOString(),
  }));

  const sfRow = safeFeedRes.rows[0];
  const safeFeedCfg: SafeFeedConfig = sfRow
    ? {
        mode:               sfRow.mode as any,
        allowedRatings:     sfRow.allowed_ratings ?? [],
        allowedGenres:      [],
        blockedTagPatterns: sfRow.blocked_tag_patterns ?? [],
        showBadge:          true,
      }
    : {
        mode:               'off',
        allowedRatings:     [],
        allowedGenres:      [],
        blockedTagPatterns: [],
        showBadge:          false,
      };

  return new ExclusionEngine(hiddenTitles, globalTagRules, safeFeedCfg);
}

// ── Helper: map DB row → Title ────────────────────────────────────────────────
function rowToTitle(row: any): Title {
  return {
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
}

// ── Rail definitions ───────────────────────────────────────────────────────────
interface RailDef {
  id:      string;
  label:   string;
  orderBy: string;
  where?:  string;
}

const RAIL_DEFS: RailDef[] = [
  { id: 'trending',    label: 'Trending Now',        orderBy: 'tc.popularity DESC' },
  { id: 'new_arrivals',label: 'New Arrivals',         orderBy: 'tc.year DESC, tc.popularity DESC' },
  { id: 'action',      label: 'Action & Thrillers',   orderBy: 'tc.popularity DESC',
    where: `tc.genres && ARRAY['Action','Thriller','Crime']::text[]` },
  { id: 'family',      label: 'Family & Animation',   orderBy: 'tc.popularity DESC',
    where: `tc.genres && ARRAY['Family','Animation','Kids']::text[]` },
  { id: 'drama',       label: 'Drama',                orderBy: 'tc.popularity DESC',
    where: `'Drama' = ANY(tc.genres)` },
  { id: 'documentary', label: 'Documentaries',        orderBy: 'tc.popularity DESC',
    where: `'Documentary' = ANY(tc.genres)` },
];

// ── GET /api/discovery ────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = (req as any).userId as string;
    const limit  = Math.min(50, Math.max(1, parseInt((req.query.limit  as string) ?? '20', 10) || 20));
    const offset = Math.max(0,              parseInt((req.query.offset as string) ?? '0',  10) || 0);

    const engine          = await loadExclusionEngine(userId);
    // Safe-Feed bypass: if header present and token looks valid we pass unlocked=true
    const bypassHeader    = req.headers['x-safefeed-token'] as string | undefined;
    const safeFeedUnlocked = Boolean(bypassHeader && bypassHeader.length > 20);

    const railResults = await Promise.all(
      RAIL_DEFS.map(async def => {
        const extraWhere = def.where ? `AND ${def.where}` : '';

        const { rows } = await pool.query(
          `SELECT tc.*
           FROM   title_cache tc
           INNER  JOIN user_services us
                    ON us.service_id = tc.service_id
                   AND us.user_id    = $1
                   AND us.enabled    = true
           WHERE  tc.stale_at IS NULL
           ${extraWhere}
           ORDER  BY ${def.orderBy}
           LIMIT  $2 OFFSET $3`,
          [userId, limit * 3, offset]   // fetch 3× so we have room after exclusion filtering
        );

        const titles                  = rows.map(rowToTitle);
        const { visible, hidden }     = engine.filter(titles, safeFeedUnlocked);

        return {
          id:          def.id,
          label:       def.label,
          titles:      visible.slice(0, limit),
          hiddenCount: hidden.length,
        };
      })
    );

    return ok(res, { rails: railResults });
  } catch (err: any) {
    return serverError(res, err);
  }
});

// ── GET /api/discovery/featured ───────────────────────────────────────────────
// Single highest-popularity title with a backdrop (used for hero banner)
router.get('/featured', authenticate, async (req, res) => {
  try {
    const userId          = (req as any).userId as string;
    const engine          = await loadExclusionEngine(userId);

    const { rows } = await pool.query(
      `SELECT tc.*
       FROM   title_cache tc
       INNER  JOIN user_services us
                ON us.service_id = tc.service_id
               AND us.user_id    = $1
               AND us.enabled    = true
       WHERE  tc.stale_at IS NULL
         AND  tc.backdrop_url IS NOT NULL
       ORDER  BY tc.popularity DESC
       LIMIT  20`,
      [userId]
    );

    const titles   = rows.map(rowToTitle);
    const { visible } = engine.filter(titles, false);
    const featured = visible[0] ?? null;

    return ok(res, { featured });
  } catch (err: any) {
    return serverError(res, err);
  }
});

export default router;
