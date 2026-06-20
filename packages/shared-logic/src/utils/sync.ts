import type { SyncPayload, UserProfile } from '@streambrws/shared-types';
import type { ExclusionState } from '../store/exclusionStore';
import type { SafeFeedState } from '../store/safeFeedStore';

export function buildSyncPayload(
  exclusions: ExclusionState,
  safeFeed: SafeFeedState
): SyncPayload {
  return {
    serviceToggles: exclusions.serviceToggles,
    exclusionSettings: {
      tags: exclusions.tags,
      hiddenTitles: exclusions.hiddenTitles,
      hiddenTitleSearchEnabled: exclusions.hiddenTitleSearchEnabled,
      lastSyncedAt: exclusions.lastSyncedAt,
    },
    safeFeedConfig: {
      enabled: safeFeed.config.enabled,
      hasPinSet: safeFeed.config.hasPinSet,
      allowedServiceIds: safeFeed.config.allowedServiceIds,
      allowedTags: safeFeed.config.allowedTags,
    },
    clientTimestamp: new Date().toISOString(),
  };
}
