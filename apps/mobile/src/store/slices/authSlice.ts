/**
 * authSlice.ts — authentication state (v3, updated).
 *
 * State additions:
 *   isOnboarding: boolean  — true when user just registered (hasn't done first-run setup)
 *
 * This flag is checked by AppNavigator to route new users to OnboardingScreen.
 * Set to false after OnboardingScreen calls onComplete().
 */

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { getApiClient } from '../apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:       string;
  email:    string;
  username: string;
}

export interface AuthState {
  user:          AuthUser | null;
  accessToken:   string | null;
  refreshToken:  string | null;
  status:        'idle' | 'authenticating' | 'authenticated' | 'unauthenticated';
  hydrated:      boolean;   // true once SecureStore has been read on app start
  isOnboarding:  boolean;   // true for brand-new accounts (route to Onboarding)
  error:         string | null;
}

const initialState: AuthState = {
  user:         null,
  accessToken:  null,
  refreshToken: null,
  status:       'idle',
  hydrated:     false,
  isOnboarding: false,
  error:        null,
};

// ─── Secure storage keys ──────────────────────────────────────────────────────

const KEYS = {
  ACCESS:       'streamhub_access_token',
  REFRESH:      'streamhub_refresh_token',
  ONBOARDING:   'streamhub_is_onboarding',
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

/** Called on app start — reads tokens from SecureStore and fetches /auth/me */
export const hydrateFromStorage = createAsyncThunk(
  'auth/hydrateFromStorage',
  async () => {
    const [access, refresh, onboarding] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS),
      SecureStore.getItemAsync(KEYS.REFRESH),
      SecureStore.getItemAsync(KEYS.ONBOARDING),
    ]);

    if (!access || !refresh) {
      return { user: null, accessToken: null, refreshToken: null, isOnboarding: false };
    }

    // Attempt to fetch current user profile
    try {
      const api = getApiClient();
      api.setTokens(access, refresh);
      const res = await api.get<{ data: { user: AuthUser } }>('/api/auth/me');
      return {
        user:         res.data.data.user,
        accessToken:  access,
        refreshToken: refresh,
        isOnboarding: onboarding === 'true',
      };
    } catch {
      // Tokens expired or invalid — clear them
      await Promise.all([
        SecureStore.deleteItemAsync(KEYS.ACCESS),
        SecureStore.deleteItemAsync(KEYS.REFRESH),
      ]);
      return { user: null, accessToken: null, refreshToken: null, isOnboarding: false };
    }
  }
);

/** Login with email + password */
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const api = getApiClient();
      const res = await api.post<{
        data: { user: AuthUser; accessToken: string; refreshToken: string };
      }>('/api/auth/login', credentials);

      const { user, accessToken, refreshToken } = res.data.data;
      api.setTokens(accessToken, refreshToken);

      await Promise.all([
        SecureStore.setItemAsync(KEYS.ACCESS,  accessToken),
        SecureStore.setItemAsync(KEYS.REFRESH, refreshToken),
      ]);

      return { user, accessToken, refreshToken, isOnboarding: false };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error ?? 'Login failed');
    }
  }
);

/** Sign up with email + username + password */
export const signup = createAsyncThunk(
  'auth/signup',
  async (
    payload: { email: string; username: string; password: string },
    { rejectWithValue }
  ) => {
    try {
      const api = getApiClient();
      const res = await api.post<{
        data: { user: AuthUser; accessToken: string; refreshToken: string };
      }>('/api/auth/signup', payload);

      const { user, accessToken, refreshToken } = res.data.data;
      api.setTokens(accessToken, refreshToken);

      await Promise.all([
        SecureStore.setItemAsync(KEYS.ACCESS,      accessToken),
        SecureStore.setItemAsync(KEYS.REFRESH,     refreshToken),
        SecureStore.setItemAsync(KEYS.ONBOARDING,  'true'),   // new user → show onboarding
      ]);

      return { user, accessToken, refreshToken, isOnboarding: true };
    } catch (err: any) {
      return rejectWithValue(err?.response?.data?.error ?? 'Sign up failed');
    }
  }
);

/** Log out — clears tokens */
export const logout = createAsyncThunk('auth/logout', async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.ACCESS),
    SecureStore.deleteItemAsync(KEYS.REFRESH),
    SecureStore.deleteItemAsync(KEYS.ONBOARDING),
  ]);
  getApiClient().clearTokens();
});

// ─── Slice ────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Called by OnboardingScreen when setup is complete */
    completeOnboarding(state) {
      state.isOnboarding = false;
      SecureStore.deleteItemAsync(KEYS.ONBOARDING);   // fire-and-forget
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // ── hydrateFromStorage ────────────────────────────────────────────────
    builder.addCase(hydrateFromStorage.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken, isOnboarding } = action.payload;
      state.user          = user;
      state.accessToken   = accessToken;
      state.refreshToken  = refreshToken;
      state.isOnboarding  = isOnboarding;
      state.status        = user ? 'authenticated' : 'unauthenticated';
      state.hydrated      = true;
    });
    builder.addCase(hydrateFromStorage.rejected, state => {
      state.status   = 'unauthenticated';
      state.hydrated = true;
    });

    // ── login ──────────────────────────────────────────────────────────────
    builder.addCase(login.pending, state => {
      state.status = 'authenticating';
      state.error  = null;
    });
    builder.addCase(login.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken, isOnboarding } = action.payload;
      state.user          = user;
      state.accessToken   = accessToken;
      state.refreshToken  = refreshToken;
      state.isOnboarding  = isOnboarding;
      state.status        = 'authenticated';
      state.error         = null;
    });
    builder.addCase(login.rejected, (state, action) => {
      state.status = 'unauthenticated';
      state.error  = action.payload as string;
    });

    // ── signup ─────────────────────────────────────────────────────────────
    builder.addCase(signup.pending, state => {
      state.status = 'authenticating';
      state.error  = null;
    });
    builder.addCase(signup.fulfilled, (state, action) => {
      const { user, accessToken, refreshToken, isOnboarding } = action.payload;
      state.user          = user;
      state.accessToken   = accessToken;
      state.refreshToken  = refreshToken;
      state.isOnboarding  = isOnboarding;
      state.status        = 'authenticated';
      state.error         = null;
    });
    builder.addCase(signup.rejected, (state, action) => {
      state.status = 'unauthenticated';
      state.error  = action.payload as string;
    });

    // ── logout ─────────────────────────────────────────────────────────────
    builder.addCase(logout.fulfilled, state => {
      state.user          = null;
      state.accessToken   = null;
      state.refreshToken  = null;
      state.isOnboarding  = false;
      state.status        = 'unauthenticated';
      state.error         = null;
    });
  },
});

export const { completeOnboarding, clearError } = authSlice.actions;
export default authSlice.reducer;
