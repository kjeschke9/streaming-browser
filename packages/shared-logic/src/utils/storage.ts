// Platform-agnostic storage interface
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

let _adapter: StorageAdapter | null = null;

export function setStorageAdapter(adapter: StorageAdapter) {
  _adapter = adapter;
}

export const storage = {
  get: (key: string) => _adapter?.getItem(key) ?? Promise.resolve(null),
  set: (key: string, value: string) => _adapter?.setItem(key, value) ?? Promise.resolve(),
  remove: (key: string) => _adapter?.removeItem(key) ?? Promise.resolve(),
  clear: () => _adapter?.clear() ?? Promise.resolve(),
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'sb:access_token',
  REFRESH_TOKEN: 'sb:refresh_token',
  USER_PROFILE:  'sb:user_profile',
  EXCLUSIONS:    'sb:exclusions',
  SAFE_FEED:     'sb:safe_feed',
  LAST_SYNC:     'sb:last_sync',
} as const;
