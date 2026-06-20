import Constants from 'expo-constants';
import { configureClient, setAccessToken } from '@streambrws/shared-logic';
import { useAuthStore } from '../store';

const API_BASE = (Constants.expoConfig?.extra?.['apiBaseUrl'] as string) ?? 'http://localhost:4000/api';

export function initApiClient() {
  configureClient(API_BASE);
}

export function syncTokenToClient() {
  const token = useAuthStore.getState().accessToken;
  setAccessToken(token);
}
