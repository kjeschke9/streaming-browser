/**
 * React hook: wire up push notifications in the mobile app.
 * Place in apps/mobile/src/hooks/useNotifications.ts
 * Call once inside AppNavigator after auth is confirmed.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  setupPushNotifications,
  addNotificationListener,
  addResponseListener,
} from '../services/notificationService';
import { ApiClient } from '@streaming/api-client';

export function useNotifications(apiClient: ApiClient) {
  const isAuthenticated = useSelector(
    (s: RootState) => s.auth.status === 'authenticated',
  );
  const setupDone = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || setupDone.current) return;
    setupDone.current = true;

    setupPushNotifications(apiClient).then(result => {
      if (result.error) {
        console.warn('[notifications]', result.error);
      } else {
        console.log('[notifications] registered token:', result.token?.slice(0, 20) + '…');
      }
    });

    const cleanNotif  = addNotificationListener(n => {
      console.log('[notification received]', n.request.content.title);
    });
    const cleanResp   = addResponseListener(r => {
      // Deep-link into title detail when user taps notification
      const titleId = r.notification.request.content.data?.titleId as string | undefined;
      if (titleId) {
        console.log('[notification tapped] titleId:', titleId);
        // Navigation handled at app level via linking config
      }
    });

    return () => { cleanNotif(); cleanResp(); };
  }, [isAuthenticated, apiClient]);
}
