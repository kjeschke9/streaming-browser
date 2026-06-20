import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useExclusionStore } from '../store';
import { useSync } from './useSync';
import { useAuthStore } from '../store';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useAutoSync() {
  const { sync }          = useSync();
  const { isDirty }       = useExclusionStore();
  const isAuthenticated   = useAuthStore(s => s.isAuthenticated);
  const lastSyncRef       = useRef<number>(0);
  const intervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const maybeSync = async () => {
    if (!isAuthenticated) return;
    const now = Date.now();
    if (now - lastSyncRef.current > SYNC_INTERVAL_MS) {
      await sync();
      lastSyncRef.current = now;
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    // Sync on mount
    maybeSync();

    // Periodic sync
    intervalRef.current = setInterval(maybeSync, SYNC_INTERVAL_MS);

    // Sync on app foreground
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') maybeSync();
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      sub.remove();
    };
  }, [isAuthenticated]);

  // Sync when dirty flag flips
  useEffect(() => {
    if (isDirty && isAuthenticated) {
      const timer = setTimeout(sync, 2000); // debounce 2s
      return () => clearTimeout(timer);
    }
  }, [isDirty, isAuthenticated]);
}
