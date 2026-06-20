/**
 * deepLinks.ts — maps a title + serviceId to a watchable URL.
 *
 * Strategy (in priority order):
 *   1. Try the service's native app URI scheme (opens the app if installed)
 *   2. Fall back to the service's web search URL with the title pre-filled
 *
 * Why not exact content IDs?
 *   Getting the real Netflix/Prime/etc. content ID for a TMDB title requires
 *   either the JustWatch API (paid B2B) or per-service scraping (violates ToS).
 *   Search-based deep links are reliable, legal, and work on all platforms.
 *
 * Future upgrade path:
 *   Add a `serviceIdMap` table in the DB (tmdb_id → {netflix_id, prime_id, …})
 *   populated via a licensed data provider. Swap resolveDeepLink() to check
 *   that table first before falling back to search.
 */

import { Linking, Platform } from 'react-native';
import type { ServiceId }    from '@streaming/types';

// ─── URL templates ────────────────────────────────────────────────────────────

interface ServiceLinks {
  /** Native app URI (may not be installed) */
  nativeScheme: string | null;
  /** Web search URL — always works */
  webSearch: (title: string) => string;
  /** App Store / Play Store URL for install prompt */
  storeUrl: { ios: string; android: string } | null;
}

const SERVICE_LINKS: Record<ServiceId, ServiceLinks> = {
  netflix: {
    nativeScheme: 'nflx://',
    webSearch: t => `https://www.netflix.com/search?q=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/netflix/id363590051',
      android: 'https://play.google.com/store/apps/details?id=com.netflix.mediaclient',
    },
  },
  prime: {
    nativeScheme: 'aiv://',
    webSearch: t => `https://www.amazon.com/gp/video/search?phrase=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/amazon-prime-video/id545519333',
      android: 'https://play.google.com/store/apps/details?id=com.amazon.avod.thirdpartyclient',
    },
  },
  hulu: {
    nativeScheme: 'hulu://',
    webSearch: t => `https://www.hulu.com/search?q=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/hulu/id376510438',
      android: 'https://play.google.com/store/apps/details?id=com.hulu.plus',
    },
  },
  disney: {
    nativeScheme: 'disneyplus://',
    webSearch: t => `https://www.disneyplus.com/search/${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/disney/id1446075923',
      android: 'https://play.google.com/store/apps/details?id=com.disney.disneyplus',
    },
  },
  hbo: {
    nativeScheme: 'max://',
    webSearch: t => `https://www.max.com/search?q=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/max-stream-hbo-tv-movies/id1666653815',
      android: 'https://play.google.com/store/apps/details?id=com.hbo.hbonow',
    },
  },
  apple: {
    nativeScheme: null,                           // Apple TV+ uses universal links only
    webSearch: t => `https://tv.apple.com/search?term=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/apple-tv/id1174078549',
      android: 'https://play.google.com/store/apps/details?id=com.apple.atve.androidtv.appletv',
    },
  },
  peacock: {
    nativeScheme: 'peacocktv://',
    webSearch: t => `https://www.peacocktv.com/stream/search?q=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/peacock-tv-stream-tv-movies/id1508186374',
      android: 'https://play.google.com/store/apps/details?id=com.peacocktv.peacockandroid',
    },
  },
  paramount: {
    nativeScheme: 'paramount://',
    webSearch: t => `https://www.paramountplus.com/search/${encodeURIComponent(t)}/`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/paramount/id1340650234',
      android: 'https://play.google.com/store/apps/details?id=com.cbs.app',
    },
  },
  crunchyroll: {
    nativeScheme: 'crunchyroll://',
    webSearch: t => `https://www.crunchyroll.com/search?q=${encodeURIComponent(t)}`,
    storeUrl: {
      ios:     'https://apps.apple.com/app/crunchyroll/id329913454',
      android: 'https://play.google.com/store/apps/details?id=com.crunchyroll.crunchyroid',
    },
  },
};

// ─── Resolution result ────────────────────────────────────────────────────────

export interface ResolvedLink {
  url:        string;
  isNative:   boolean;
  label:      string;          // e.g. "Open in Netflix", "Search on Netflix"
  storeUrl:   { ios: string; android: string } | null;
}

// ─── Main resolver ────────────────────────────────────────────────────────────

/**
 * Resolves the best available link for a title on a streaming service.
 *
 * @param serviceId  The streaming service
 * @param titleName  The human-readable title (used for search fallback)
 * @param tmdbId     TMDB numeric ID (reserved for future exact-link support)
 */
export async function resolveDeepLink(
  serviceId: ServiceId,
  titleName: string,
  _tmdbId?: number,
): Promise<ResolvedLink> {
  const cfg = SERVICE_LINKS[serviceId];
  if (!cfg) {
    // Unknown service — generic web search
    return {
      url:      `https://www.google.com/search?q=${encodeURIComponent(titleName + ' streaming')}`,
      isNative: false,
      label:    'Search on Google',
      storeUrl: null,
    };
  }

  // Try native scheme first
  if (cfg.nativeScheme) {
    try {
      const canOpen = await Linking.canOpenURL(cfg.nativeScheme);
      if (canOpen) {
        // Most app schemes just open the app home; search via the web URL is better UX
        // so we use web search for content discovery even when the app is available.
        // The "Open in App" button will handle the native launch.
      }
    } catch {
      // canOpenURL may throw in some environments — safe to ignore
    }
  }

  // Web search link is always the primary link (most reliable)
  const webUrl = cfg.webSearch(titleName);

  return {
    url:      webUrl,
    isNative: false,
    label:    `Search on ${serviceIdToLabel(serviceId)}`,
    storeUrl: cfg.storeUrl,
  };
}

/**
 * Attempt to open the service's native app (if installed) at its home screen.
 * Falls back to the web URL if the app isn't installed.
 */
export async function openInNativeApp(
  serviceId: ServiceId,
  titleName: string,
): Promise<'native' | 'web' | 'store'> {
  const cfg = SERVICE_LINKS[serviceId];
  if (!cfg) return 'web';

  // 1. Try native scheme
  if (cfg.nativeScheme) {
    try {
      const canOpen = await Linking.canOpenURL(cfg.nativeScheme);
      if (canOpen) {
        await Linking.openURL(cfg.nativeScheme);
        return 'native';
      }
    } catch { /* fall through */ }
  }

  // 2. Try web search
  const webUrl = cfg.webSearch(titleName);
  try {
    await Linking.openURL(webUrl);
    return 'web';
  } catch { /* fall through */ }

  // 3. Prompt install
  const storeUrl = cfg.storeUrl
    ? (Platform.OS === 'ios' ? cfg.storeUrl.ios : cfg.storeUrl.android)
    : null;

  if (storeUrl) {
    await Linking.openURL(storeUrl);
    return 'store';
  }

  return 'web';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function serviceIdToLabel(id: ServiceId): string {
  const labels: Record<ServiceId, string> = {
    netflix: 'Netflix', prime: 'Prime Video', hulu: 'Hulu',
    disney: 'Disney+', hbo: 'Max', apple: 'Apple TV+',
    peacock: 'Peacock', paramount: 'Paramount+', crunchyroll: 'Crunchyroll',
  };
  return labels[id] ?? id;
}

export function serviceIdToColor(id: ServiceId): string {
  const colors: Record<ServiceId, string> = {
    netflix: '#E50914', prime: '#00A8E1', hulu: '#1CE783',
    disney: '#113CCF', hbo: '#5822E0', apple: '#555555',
    peacock: '#E08700', paramount: '#0064FF', crunchyroll: '#F47521',
  };
  return colors[id] ?? '#666666';
}
