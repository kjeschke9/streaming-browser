// ─── Streaming Services ───────────────────────────────────────────────────────
export type ServiceId =
  | 'netflix'
  | 'hulu'
  | 'hbo_max'
  | 'disney_plus'
  | 'amazon_prime'
  | 'apple_tv'
  | 'paramount_plus'
  | 'peacock'
  | 'showtime'
  | 'starz';

export interface StreamingService {
  id: ServiceId;
  name: string;
  color: string;
  logoUrl?: string;
  enabled: boolean;
}

// ─── Content / Titles ─────────────────────────────────────────────────────────
export type ContentType = 'movie' | 'series' | 'documentary' | 'short' | 'special';

export interface ContentTitle {
  id: string;
  serviceId: ServiceId;
  externalId: string;
  title: string;
  description: string;
  type: ContentType;
  genres: string[];
  tags: string[];
  rating: string;
  year: number;
  posterUrl?: string;
  backdropUrl?: string;
  deepLinkUrl?: string;
}

// ─── Exclusion / Hiding ───────────────────────────────────────────────────────
export interface ExclusionTag {
  id: string;
  userId: string;
  tag: string;          // e.g. "horror", "violence", "political"
  createdAt: string;
}

export interface HiddenTitle {
  id: string;
  userId: string;
  titleId: string;
  serviceId: ServiceId;
  titleSnapshot: string; // stored title name for offline display
  hiddenAt: string;
}

export interface ExclusionSettings {
  tags: ExclusionTag[];
  hiddenTitles: HiddenTitle[];
  hiddenTitleSearchEnabled: boolean; // show hidden titles in search or not
  lastSyncedAt?: string;
}

// ─── Safe-Feed Mode ───────────────────────────────────────────────────────────
export interface SafeFeedConfig {
  enabled: boolean;
  pinHash?: string;     // bcrypt hash stored server-side; never sent to client
  hasPinSet: boolean;   // client-safe field
  allowedServiceIds: ServiceId[];
  allowedTags: string[];
}

// ─── User / Auth ──────────────────────────────────────────────────────────────
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  serviceToggles: Partial<Record<ServiceId, boolean>>;
  exclusionSettings: ExclusionSettings;
  safeFeed: SafeFeedConfig;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

// ─── API Response wrappers ───────────────────────────────────────────────────
export interface ApiSuccess<T> {
  ok: true;
  data: T;
  message?: string;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── Sync ─────────────────────────────────────────────────────────────────────
export interface SyncPayload {
  serviceToggles: Partial<Record<ServiceId, boolean>>;
  exclusionSettings: ExclusionSettings;
  safeFeedConfig: Omit<SafeFeedConfig, 'pinHash'>;
  clientTimestamp: string;
}

export interface SyncResult {
  merged: SyncPayload;
  serverTimestamp: string;
  conflicts: string[];
}

// ─── Navigation (shared shape) ────────────────────────────────────────────────
export type RootScreen =
  | 'Home'
  | 'Browse'
  | 'Search'
  | 'Settings'
  | 'SafeFeed'
  | 'HiddenTitles'
  | 'Login'
  | 'Register'
  | 'Profile';
