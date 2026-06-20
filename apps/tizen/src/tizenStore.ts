import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ContentTitle, ServiceId, UserProfile } from '@streambrws/shared-types';

// Tizen localStorage adapter
const tizenStorage = {
  getItem: (key: string) => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null'); } catch { return null; }
  },
  setItem: (key: string, value: unknown) => {
    localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string) => localStorage.removeItem(key),
};

interface TizenStore {
  // Auth
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setTokens: (access: string, refresh: string) => void;
  setUser: (u: UserProfile) => void;
  logout: () => void;

  // Exclusions
  tags: string[];
  hiddenTitleIds: string[];
  hiddenTitleSearchEnabled: boolean;
  serviceToggles: Partial<Record<ServiceId, boolean>>;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  hideTitle: (id: string) => void;
  unhideTitle: (id: string) => void;
  toggleService: (id: ServiceId, enabled: boolean) => void;
  setHiddenSearch: (v: boolean) => void;

  // Safe Feed
  safeFeedEnabled: boolean;
  safeFeedUnlocked: boolean;
  hasPinSet: boolean;
  allowedServiceIds: ServiceId[];
  allowedTags: string[];
  setSafeFeedEnabled: (v: boolean) => void;
  setSafeFeedUnlocked: (v: boolean) => void;
  setHasPinSet: (v: boolean) => void;

  // UI
  focusedId: string | null;
  setFocused: (id: string | null) => void;
  activeScreen: 'home' | 'search' | 'settings' | 'hidden' | 'login';
  setScreen: (s: TizenStore['activeScreen']) => void;

  // Load from profile
  loadFromProfile: (profile: UserProfile) => void;
}

export const useTizenStore = create<TizenStore>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),

      tags: [],
      hiddenTitleIds: [],
      hiddenTitleSearchEnabled: false,
      serviceToggles: {},
      addTag: (tag) => set(s => ({ tags: [...new Set([...s.tags, tag.toLowerCase()])] })),
      removeTag: (tag) => set(s => ({ tags: s.tags.filter(t => t !== tag) })),
      hideTitle: (id) => set(s => ({ hiddenTitleIds: [...new Set([...s.hiddenTitleIds, id])] })),
      unhideTitle: (id) => set(s => ({ hiddenTitleIds: s.hiddenTitleIds.filter(h => h !== id) })),
      toggleService: (id, enabled) => set(s => ({ serviceToggles: { ...s.serviceToggles, [id]: enabled } })),
      setHiddenSearch: (hiddenTitleSearchEnabled) => set({ hiddenTitleSearchEnabled }),

      safeFeedEnabled: false,
      safeFeedUnlocked: false,
      hasPinSet: false,
      allowedServiceIds: [],
      allowedTags: [],
      setSafeFeedEnabled: (v) => set({ safeFeedEnabled: v }),
      setSafeFeedUnlocked: (v) => set({ safeFeedUnlocked: v }),
      setHasPinSet: (v) => set({ hasPinSet: v }),

      focusedId: null,
      setFocused: (id) => set({ focusedId: id }),
      activeScreen: 'login',
      setScreen: (s) => set({ activeScreen: s }),

      loadFromProfile: (profile) => set({
        tags: profile.exclusionSettings.tags.map(t => t.tag),
        hiddenTitleIds: profile.exclusionSettings.hiddenTitles.map(h => h.titleId),
        hiddenTitleSearchEnabled: profile.exclusionSettings.hiddenTitleSearchEnabled,
        serviceToggles: profile.serviceToggles,
        safeFeedEnabled: profile.safeFeed.enabled,
        hasPinSet: profile.safeFeed.hasPinSet,
        allowedServiceIds: profile.safeFeed.allowedServiceIds,
        allowedTags: profile.safeFeed.allowedTags,
        user: profile,
      }),
    }),
    {
      name: 'streambrws-tizen',
      storage: {
        getItem: (key) => tizenStorage.getItem(key),
        setItem: (key, value) => tizenStorage.setItem(key, value),
        removeItem: (key) => tizenStorage.removeItem(key),
      },
    }
  )
);
