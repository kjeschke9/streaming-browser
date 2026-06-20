import type { ContentTitle, SafeFeedConfig } from '@streambrws/shared-types';
import type { ExclusionState } from '../store/exclusionStore';

export function applySafeFeed(
  titles: ContentTitle[],
  safeFeed: SafeFeedConfig,
  isUnlocked: boolean
): ContentTitle[] {
  if (!safeFeed.enabled || isUnlocked) return titles;
  const allowedServices = new Set(safeFeed.allowedServiceIds);
  const allowedTags = new Set(safeFeed.allowedTags.map(t => t.toLowerCase()));
  return titles.filter(title => {
    if (!allowedServices.has(title.serviceId)) return false;
    const labels = [...title.genres, ...title.tags].map(l => l.toLowerCase());
    return labels.every(l => allowedTags.size === 0 || allowedTags.has(l));
  });
}

export function applyExclusions(
  titles: ContentTitle[],
  exclusions: ExclusionState,
  isSearch = false
): ContentTitle[] {
  const hiddenIds = new Set(exclusions.hiddenTitles.map(h => h.titleId));
  const tagSet = new Set(exclusions.tags.map(t => t.tag.toLowerCase()));

  return titles.filter(title => {
    if (exclusions.serviceToggles[title.serviceId] === false) return false;
    if (hiddenIds.has(title.id)) {
      return isSearch && exclusions.hiddenTitleSearchEnabled;
    }
    const labels = [...title.genres, ...title.tags].map(l => l.toLowerCase());
    if (labels.some(l => tagSet.has(l))) return false;
    return true;
  });
}

export function searchTitles(
  titles: ContentTitle[],
  query: string,
  exclusions: ExclusionState
): ContentTitle[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const matched = titles.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.genres.some(g => g.toLowerCase().includes(q))
  );
  return applyExclusions(matched, exclusions, true);
}
