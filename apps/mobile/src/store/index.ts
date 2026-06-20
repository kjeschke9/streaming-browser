import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import type { UserProfile, ContentTitle, ServiceId } from '@streambrws/shared-types';
import type { SafeFeedState } from '@streambrws/shared-logic';

// MMKV storage instance
export const mmkv = new MMKV({ id: 'streambrws' });

const mmkvStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.delete(key),
};

// ─── Auth Store ───────────────────────────────────────────────────────────────
interface AuthStore {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'sb-auth',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);

// ─── Exclusion Store ──────────────────────────────────────────────────────────
interface ExclusionStore {
  tags: string[];
  hiddenTitleIds: Set<string>;
  hiddenTitleSearchEnabled: boolean;
  serviceToggles: Partial<Record<ServiceId, boolean>>;
  isDirty: boolean;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  hideTitle: (id: string) => void;
  unhideTitle: (id: string) => void;
  setHiddenSearch: (val: boolean) => void;
  toggleService: (id: ServiceId, enabled: boolean) => void;
  loadFromProfile: (profile: UserProfile) => void;
  markClean: () => void;
}

export const useExclusionStore = create<ExclusionStore>()(
  persist(
    (set) => ({
      tags: [],
      hiddenTitleIds: new Set(),
      hiddenTitleSearchEnabled: false,
      serviceToggles: {},
      isDirty: false,
      addTag: (tag) =>
        set((s) => ({ tags: [...new Set([...s.tags, tag.toLowerCase()])], isDirty: true })),
      removeTag: (tag) =>
        set((s) => ({ tags: s.tags.filter((t) => t !== tag), isDirty: true })),
      hideTitle: (id) =>
        set((s) => ({ hiddenTitleIds: new Set([...s.hiddenTitleIds, id]), isDirty: true })),
      unhideTitle: (id) =>
        set((s) => {
          const next = new Set(s.hiddenTitleIds);
          next.delete(id);
          return { hiddenTitleIds: next, isDirty: true };
        }),
      setHiddenSearch: (hiddenTitleSearchEnabled) => set({ hiddenTitleSearchEnabled, isDirty: true }),
      toggleService: (id, enabled) =>
        set((s) => ({ serviceToggles: { ...s.serviceToggles, [id]: enabled }, isDirty: true })),
      loadFromProfile: (profile) =>
        set({
          tags: profile.exclusionSettings.tags.map((t) => t.tag),
          hiddenTitleIds: new Set(profile.exclusionSettings.hiddenTitles.map((h) => h.titleId)),
          hiddenTitleSearchEnabled: profile.exclusionSettings.hiddenTitleSearchEnabled,
          serviceToggles: profile.serviceToggles,
          isDirty: false,
        }),
      markClean: () => set({ isDirty: false }),
    }),
    {
      name: 'sb-exclusions',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        tags: s.tags,
        hiddenTitleIds: [...s.hiddenTitleIds],
        hiddenTitleSearchEnabled: s.hiddenTitleSearchEnabled,
        serviceToggles: s.serviceToggles,
      }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        hiddenTitleIds: new Set(persisted.hiddenTitleIds ?? []),
      }),
    }
  )
);

// ─── Safe Feed Store ──────────────────────────────────────────────────────────
interface SafeFeedStore {
  enabled: boolean;
  hasPinSet: boolean;
  isUnlocked: boolean;
  allowedServiceIds: ServiceId[];
  allowedTags: string[];
  setEnabled: (val: boolean) => void;
  setUnlocked: (val: boolean) => void;
  setHasPinSet: (val: boolean) => void;
  loadFromProfile: (profile: UserProfile) => void;
}

export const useSafeFeedStore = create<SafeFeedStore>()(
  persist(
    (set) => ({
      enabled: false,
      hasPinSet: false,
      isUnlocked: false,
      allowedServiceIds: [],
      allowedTags: [],
      setEnabled: (enabled) => set({ enabled }),
      setUnlocked: (isUnlocked) => set({ isUnlocked }),
      setHasPinSet: (hasPinSet) => set({ hasPinSet }),
      loadFromProfile: (profile) =>
        set({
          enabled: profile.safeFeed.enabled,
          hasPinSet: profile.safeFeed.hasPinSet,
          allowedServiceIds: profile.safeFeed.allowedServiceIds,
          allowedTags: profile.safeFeed.allowedTags,
        }),
    }),
    {
      name: 'sb-safefeed',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (s) => ({
        enabled: s.enabled,
        hasPinSet: s.hasPinSet,
        allowedServiceIds: s.allowedServiceIds,
        allowedTags: s.allowedTags,
      }),
    }
  )
);
