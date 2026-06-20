/**
 * types.ts — Central navigation type definitions.
 *
 * All screen param types live here so every navigator and screen can import
 * from one canonical location without circular deps.
 */

import type { Title } from '@streaming/types';

// ─── Root Stack (outermost) ───────────────────────────────────────────────────

export type RootStackParamList = {
  /** Shown before auth state is known */
  Splash:      undefined;
  /** First-run experience for new users */
  Onboarding:  undefined;
  /** Auth sub-stack (Login / Signup) */
  Auth:        undefined;
  /** Main tab + settings sub-stack */
  Main:        undefined;
  /** Title detail — can be reached from any tab */
  TitleDetail: { title?: Title; titleId?: string };
};

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Login:  undefined;
  Signup: undefined;
};

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

export type MainTabParamList = {
  Home:     undefined;
  Search:   undefined;
  Services: undefined;
  Settings: undefined;
};

// ─── Settings Stack ───────────────────────────────────────────────────────────

export type SettingsStackParamList = {
  SettingsHome:        undefined;
  SafeFeedSettings:    undefined;
  SafeFeedPin:         { mode: 'set' | 'verify' | 'change' | 'remove' };
  HiddenContentManager:undefined;
  SyncStatus:          undefined;
  About:               undefined;
};
