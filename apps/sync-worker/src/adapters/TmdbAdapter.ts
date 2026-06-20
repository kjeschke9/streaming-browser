/**
 * TmdbAdapter — pulls movies & TV from The Movie Database (TMDB) free API.
 *
 * Docs: https://developer.themoviedb.org/docs
 * Free tier: 40 req/10 s, 20,000 req/day — plenty for catalogue sync.
 *
 * Pages are 1-indexed; TMDB returns max 500 pages (20 items/page).
 * We map TMDB's genre_ids to human-readable names via the static genre map
 * below (updated from TMDB's /genre/movie/list and /genre/tv/list).
 *
 * Set TMDB_API_KEY in .env to activate this adapter.
 */

import https from 'https';
import type { ServiceAdapter, AdapterTitle } from './types';
import type { ServiceId, ContentRating, ContentType } from '@streaming/types';

// ─── TMDB Genre ID → Label map (movie + TV combined) ─────────────────────────
const GENRE_MAP: Record<number, string> = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western',
  // TV-specific
  10759: 'Action & Adventure', 10762: 'Kids', 10763: 'News',
  10764: 'Reality', 10765: 'Sci-Fi & Fantasy', 10766: 'Soap',
  10767: 'Talk', 10768: 'War & Politics',
};

// ─── TMDB vote_average → ContentRating heuristic ─────────────────────────────
// TMDB doesn't expose US content ratings for most titles in the free discover
// endpoint (would need a per-title /release_dates call). We approximate based
// on genre and vote info. Real deployments should call /movie/{id}/release_dates.
function deriveRating(genreIds: number[], mediaType: 'movie' | 'tv'): ContentRating {
  const hasAdult  = genreIds.includes(27) || genreIds.includes(53);   // horror / thriller
  const hasFamily = genreIds.includes(10751) || genreIds.includes(16); // family / animation
  const hasKids   = genreIds.includes(10762);

  if (hasKids)   return 'TV-Y7';
  if (hasFamily) return mediaType === 'tv' ? 'TV-G' : 'G';
  if (hasAdult)  return mediaType === 'tv' ? 'TV-MA' : 'R';
  return mediaType === 'tv' ? 'TV-14' : 'PG-13';
}

// ─── Simple HTTPS GET — avoids needing axios/node-fetch ───────────────────────
function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'StreamHub/1.0' } }, res => {
      let body = '';
      res.on('data', (chunk: string) => (body += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`TMDB HTTP ${res.statusCode}: ${body.slice(0, 200)}`));
        } else {
          resolve(body);
        }
      });
    }).on('error', reject);
  });
}

// ─── TMDB API response shapes ─────────────────────────────────────────────────
interface TmdbPage {
  page:          number;
  total_pages:   number;
  results:       TmdbItem[];
}

interface TmdbItem {
  id:                number;
  title?:            string;    // movies
  name?:             string;    // TV
  overview:          string;
  genre_ids:         number[];
  vote_average:      number;
  release_date?:     string;    // movies  (YYYY-MM-DD)
  first_air_date?:   string;    // TV      (YYYY-MM-DD)
  poster_path:       string | null;
  backdrop_path:     string | null;
  media_type?:       'movie' | 'tv' | 'person';
  popularity:        number;    // TMDB's own 0–∞ score
  number_of_seasons?: number;
  runtime?:          number;
}

// ─── Per-mode fetch URLs ───────────────────────────────────────────────────────
type FetchMode = 'trending' | 'movie' | 'tv';

export class TmdbAdapter implements ServiceAdapter {
  readonly serviceId: ServiceId;

  private readonly apiKey:  string;
  private readonly mode:    FetchMode;
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly imgBase = 'https://image.tmdb.org/t/p/w500';

  /**
   * @param serviceId  Which streaming service to label titles with.
   * @param apiKey     TMDB v3 API key (Bearer token also accepted — set as "Bearer xxx").
   * @param mode       'trending' | 'movie' | 'tv'  (each maps to a TMDB discover/trending call)
   */
  constructor(serviceId: ServiceId, apiKey: string, mode: FetchMode = 'trending') {
    this.serviceId = serviceId;
    this.apiKey    = apiKey;
    this.mode      = mode;
  }

  // ── fetchPage ──────────────────────────────────────────────────────────────
  async fetchPage(page: number): Promise<AdapterTitle[]> {
    const url = this.buildUrl(page);
    const raw = await httpsGet(url);
    const data: TmdbPage = JSON.parse(raw);

    if (page > data.total_pages) return [];   // no more pages

    return data.results
      .filter(item => item.media_type !== 'person')  // trending returns people too
      .map(item => this.mapItem(item));
  }

  // ── URL builder ────────────────────────────────────────────────────────────
  private buildUrl(page: number): string {
    const key = encodeURIComponent(this.apiKey);
    const p   = encodeURIComponent(String(page));

    switch (this.mode) {
      case 'trending':
        return `${this.baseUrl}/trending/all/week?api_key=${key}&page=${p}`;
      case 'movie':
        return `${this.baseUrl}/discover/movie?api_key=${key}&sort_by=popularity.desc&page=${p}`;
      case 'tv':
        return `${this.baseUrl}/discover/tv?api_key=${key}&sort_by=popularity.desc&page=${p}`;
    }
  }

  // ── Map TMDB item → AdapterTitle ───────────────────────────────────────────
  private mapItem(item: TmdbItem): AdapterTitle {
    // Determine media type
    const isMovie = item.media_type === 'movie'
      || (item.media_type === undefined && this.mode === 'movie')
      || (item.title !== undefined && item.name === undefined);

    const mediaType: 'movie' | 'tv' = isMovie ? 'movie' : 'tv';
    const type: ContentType         = isMovie ? 'movie' : 'series';

    const name  = item.title ?? item.name ?? 'Untitled';
    const year  = this.parseYear(item.release_date ?? item.first_air_date);
    const genres = (item.genre_ids ?? []).map(id => GENRE_MAP[id]).filter(Boolean);
    const tags   = this.deriveTags(genres, mediaType);

    // Normalise TMDB popularity (0–∞, typically 0–1000 for popular titles) → 0–100
    const popularity = Math.min(100, Math.round((item.popularity ?? 0) / 10));

    return {
      serviceId:   this.serviceId,
      externalId:  `tmdb-${item.id}`,
      title:       name,
      description: item.overview ?? '',
      type,
      genres,
      tags,
      rating:      deriveRating(item.genre_ids ?? [], mediaType),
      year,
      duration:    isMovie ? (item.runtime ?? undefined) : undefined,
      seasons:     !isMovie ? (item.number_of_seasons ?? undefined) : undefined,
      posterUrl:   item.poster_path
                     ? `${this.imgBase}${item.poster_path}`
                     : `https://via.placeholder.com/500x750?text=${encodeURIComponent(name)}`,
      backdropUrl: item.backdrop_path
                     ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`
                     : undefined,
      deepLink:    `streamhub://${this.serviceId}/tmdb/${item.id}`,
      popularity,
    };
  }

  private parseYear(dateStr?: string): number {
    if (!dateStr) return new Date().getFullYear();
    const y = parseInt(dateStr.slice(0, 4), 10);
    return isNaN(y) ? new Date().getFullYear() : y;
  }

  private deriveTags(genres: string[], mediaType: 'movie' | 'tv'): string[] {
    const tags: string[] = [mediaType];
    if (genres.includes('Horror'))   tags.push('horror', 'scary');
    if (genres.includes('Animation')) tags.push('animated');
    if (genres.includes('Family'))   tags.push('family-friendly');
    if (genres.includes('Kids'))     tags.push('kids', 'family-friendly');
    if (genres.includes('Documentary')) tags.push('documentary', 'educational');
    if (genres.includes('Romance'))  tags.push('romance');
    if (genres.includes('Comedy'))   tags.push('comedy');
    if (genres.includes('Action'))   tags.push('action');
    if (genres.includes('Sci-Fi') || genres.includes('Sci-Fi & Fantasy')) tags.push('sci-fi');
    if (genres.includes('Crime') || genres.includes('Thriller')) tags.push('mature');
    return tags;
  }
}
