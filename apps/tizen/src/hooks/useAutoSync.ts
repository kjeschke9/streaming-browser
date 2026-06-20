import { useEffect, useRef } from 'react';
import { profileApi, buildSyncPayload } from '@streambrws/shared-logic';
import { useTizenStore } from '../tizenStore';

const SYNC_INTERVAL_MS = 5 * 60 * 1000;

export function useTizenAutoSync() {
  const store = useTizenStore();
  const lastSyncRef = useRef(0);

  const sync = async () => {
    if (!store.isAuthenticated) return;
    const now = Date.now();
    if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
    lastSyncRef.current = now;
    try {
      const payload = buildSyncPayload(
        {
          tags: store.tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
          hiddenTitles: store.hiddenTitleIds.map((id, i) => ({
            id: String(i), userId: '', titleId: id,
            serviceId: 'netflix' as any, titleSnapshot: id, hiddenAt: '',
          })),
          hiddenTitleSearchEnabled: store.hiddenTitleSearchEnabled,
          serviceToggles: store.serviceToggles,
          isDirty: true,
          lastSyncedAt: undefined,
        },
        {
          config: {
            enabled: store.safeFeedEnabled,
            hasPinSet: store.hasPinSet,
            allowedServiceIds: store.allowedServiceIds,
            allowedTags: store.allowedTags,
          },
          isUnlocked: store.safeFeedUnlocked,
          unlockError: null,
        }
      );
      await profileApi.sync(payload);
    } catch (e) {
      console.warn('Sync failed:', e);
    }
  };

  useEffect(() => {
    if (!store.isAuthenticated) return;
    sync();
    const id = setInterval(sync, SYNC_INTERVAL_MS);
    const handleFocus = () => sync();
    window.addEventListener('focus', handleFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', handleFocus); };
  }, [store.isAuthenticated]);
}
