/**
 * DiscoveryApi — typed client for /api/discovery
 *
 * Usage:
 *   const api = new DiscoveryApi(apiClient);
 *   const { rails } = await api.getRails({ limit: 20 });
 *   const { featured } = await api.getFeatured();
 */

import type { ApiClient }       from './ApiClient';
import type { Title }           from '@streaming/types';

export interface DiscoveryRail {
  id:          string;
  label:       string;
  titles:      Title[];
  hiddenCount: number;
}

export interface DiscoveryResponse {
  rails: DiscoveryRail[];
}

export interface FeaturedResponse {
  featured: Title | null;
}

export interface DiscoveryOptions {
  /** Max titles per rail (default 20, max 50) */
  limit?:         number;
  /** Pagination offset */
  offset?:        number;
  /** Safe-Feed bypass token (from PIN verification) */
  safeFeedToken?: string;
}

export class DiscoveryApi {
  constructor(private readonly client: ApiClient) {}

  /** Fetch all home-screen rails */
  async getRails(opts: DiscoveryOptions = {}): Promise<DiscoveryResponse> {
    const params: Record<string, string> = {};
    if (opts.limit  !== undefined) params.limit  = String(opts.limit);
    if (opts.offset !== undefined) params.offset = String(opts.offset);

    const query = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';

    const headers: Record<string, string> = {};
    if (opts.safeFeedToken) headers['X-SafeFeed-Token'] = opts.safeFeedToken;

    const res = await this.client.get<{ data: DiscoveryResponse }>(
      `/api/discovery${query}`,
      { headers }
    );
    return res.data.data;
  }

  /** Fetch the single featured/hero title */
  async getFeatured(safeFeedToken?: string): Promise<FeaturedResponse> {
    const headers: Record<string, string> = {};
    if (safeFeedToken) headers['X-SafeFeed-Token'] = safeFeedToken;

    const res = await this.client.get<{ data: FeaturedResponse }>(
      '/api/discovery/featured',
      { headers }
    );
    return res.data.data;
  }
}
