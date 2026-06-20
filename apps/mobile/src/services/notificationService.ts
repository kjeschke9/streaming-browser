/**
 * StreamHub Push Notification Service
 * Uses Expo Notifications for iOS/Android.
 * Stores the Expo push token on the backend so the server can push alerts.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ApiClient } from '@streaming/api-client';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationSetupResult {
  permission: NotificationPermission;
  token?: string;
  error?: string;
}

/**
 * Request permission and register push token with backend.
 * Call this once after user logs in.
 */
export async function setupPushNotifications(
  apiClient: ApiClient,
): Promise<NotificationSetupResult> {
  // Only physical devices support push notifications
  if (!Device.isDevice) {
    return { permission: 'undetermined', error: 'Push notifications require a physical device.' };
  }

  // Check current permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return { permission: 'denied', error: 'Notification permission denied.' };
  }

  // Android channel setup
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('streamhub-default', {
      name: 'StreamHub',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#990038',
    });
    await Notifications.setNotificationChannelAsync('streamhub-new-titles', {
      name: 'New Titles',
      description: 'Alerts when new titles arrive on your enabled services',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
    await Notifications.setNotificationChannelAsync('streamhub-sync', {
      name: 'Sync Status',
      description: 'Sync completion and error alerts',
      importance: Notifications.AndroidImportance.LOW,
    });
  }

  // Get Expo push token
  let token: string | undefined;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID ?? 'streaming-browser',
    });
    token = tokenData.data;

    // Register token with backend
    await (apiClient as any).post('/push/register', {
      token,
      platform: Platform.OS,
    });
  } catch (err) {
    return {
      permission: 'granted',
      error: `Token registration failed: ${(err as Error).message}`,
    };
  }

  return { permission: 'granted', token };
}

/**
 * Schedule a local notification (no server needed).
 * Used for reminders like "You haven't opened StreamHub in a while".
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  delaySeconds: number,
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: { seconds: delaySeconds },
  });
}

/**
 * Cancel all pending local notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Add a listener for incoming notifications while app is foregrounded.
 * Returns a cleanup function — call it in useEffect cleanup.
 */
export function addNotificationListener(
  onNotification: (notification: Notifications.Notification) => void,
): () => void {
  const sub = Notifications.addNotificationReceivedListener(onNotification);
  return () => sub.remove();
}

/**
 * Add a listener for when user taps a notification.
 * Returns a cleanup function.
 */
export function addResponseListener(
  onResponse: (response: Notifications.NotificationResponse) => void,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(onResponse);
  return () => sub.remove();
}
