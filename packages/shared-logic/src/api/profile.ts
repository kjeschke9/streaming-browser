import type { UserProfile, SyncPayload, SyncResult } from '@streambrws/shared-types';
import { apiClient } from './client';

export const profileApi = {
  getProfile: () => apiClient.get<UserProfile>('/profile'),

  updateProfile: (patch: Partial<Pick<UserProfile, 'displayName' | 'avatarUrl'>>) =>
    apiClient.patch<UserProfile>('/profile', patch),

  updateServiceToggles: (toggles: UserProfile['serviceToggles']) =>
    apiClient.put<UserProfile>('/profile/service-toggles', { toggles }),

  sync: (payload: SyncPayload) =>
    apiClient.post<SyncResult>('/profile/sync', payload),

  setPIN: (pin: string) =>
    apiClient.post<void>('/profile/safe-feed/pin', { pin }),

  verifyPIN: (pin: string) =>
    apiClient.post<{ valid: boolean }>('/profile/safe-feed/verify-pin', { pin }),

  getSafeFeed: () =>
    apiClient.get<UserProfile['safeFeed']>('/profile/safe-feed'),

  updateSafeFeed: (config: Partial<Omit<UserProfile['safeFeed'], 'pinHash'>>) =>
    apiClient.patch<UserProfile['safeFeed']>('/profile/safe-feed', config),

  addExclusionTag: (tag: string) =>
    apiClient.post<UserProfile['exclusionSettings']>('/profile/exclusions/tags', { tag }),

  removeExclusionTag: (tagId: string) =>
    apiClient.delete<UserProfile['exclusionSettings']>(`/profile/exclusions/tags/${tagId}`),

  hideTitle: (titleId: string, serviceId: string, titleSnapshot: string) =>
    apiClient.post<UserProfile['exclusionSettings']>('/profile/exclusions/hidden-titles', {
      titleId, serviceId, titleSnapshot,
    }),

  unhideTitle: (hiddenId: string) =>
    apiClient.delete<UserProfile['exclusionSettings']>(`/profile/exclusions/hidden-titles/${hiddenId}`),

  getHiddenTitles: () =>
    apiClient.get<UserProfile['exclusionSettings']['hiddenTitles']>('/profile/exclusions/hidden-titles'),
};
