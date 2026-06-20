import { useCallback, useRef } from 'react';
import { profileApi, buildSyncPayload } from '@streambrws/shared-logic';
import { useAuthStore, useExclusionStore, useSafeFeedStore } from '../store';

export function useSync() {
  const syncInFlight = useRef(false);
  const { setUser }  = useAuthStore();
  const exclusions   = useExclusionStore();
  const safeFeed     = useSafeFeedStore();
  const markClean    = useExclusionStore((s) => s.markClean);

  const sync = useCallback(async () => {
    if (syncInFlight.current) return;
    syncInFlight.current = true;
    try {
      const payload = buildSyncPayload(
        {
          tags: exclusions.tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
          hiddenTitles: [...exclusions.hiddenTitleIds].map((id, i) => ({
            id: String(i), userId: '', titleId: id,
            serviceId: 'netflix' as any, titleSnapshot: id, hiddenAt: '',
          })),
          hiddenTitleSearchEnabled: exclusions.hiddenTitleSearchEnabled,
          serviceToggles: exclusions.serviceToggles,
          isDirty: exclusions.isDirty,
          lastSyncedAt: undefined,
        },
        {
          config: {
            enabled: safeFeed.enabled,
            hasPinSet: safeFeed.hasPinSet,
            allowedServiceIds: safeFeed.allowedServiceIds,
            allowedTags: safeFeed.allowedTags,
          },
          isUnlocked: safeFeed.isUnlocked,
          unlockError: null,
        }
      );
      const res = await profileApi.sync(payload);
      if (res.ok) {
        markClean();
      }
    } finally {
      syncInFlight.current = false;
    }
  }, [exclusions, safeFeed]);

  return { sync };
}
