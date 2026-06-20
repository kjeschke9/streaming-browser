/**
 * apiClient.ts — singleton ApiClient instance for the mobile app.
 *
 * Import getApiClient() wherever you need to make API calls.
 * The client auto-refreshes tokens on 401 responses.
 */

import { ApiClient, createApiClient } from '@streaming/api-client';

let _client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!_client) {
    const baseURL = __DEV__
      ? 'http://localhost:4000'      // iOS simulator / Android emulator (via metro)
      : process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

    _client = createApiClient(baseURL);
  }
  return _client;
}

export function resetApiClient(): void {
  _client = null;
}
