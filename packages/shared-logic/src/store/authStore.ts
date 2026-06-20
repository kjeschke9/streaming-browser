import type { UserProfile, AuthTokens } from '@streambrws/shared-types';
import { setAccessToken } from '../api/client';

export interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const initialAuthState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export type AuthAction =
  | { type: 'AUTH_LOADING' }
  | { type: 'AUTH_SUCCESS'; tokens: AuthTokens; user: UserProfile }
  | { type: 'AUTH_FAILURE'; error: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'PROFILE_UPDATED'; user: UserProfile }
  | { type: 'TOKENS_REFRESHED'; tokens: AuthTokens };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      setAccessToken(action.tokens.accessToken);
      return {
        user: action.user,
        tokens: action.tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.error };
    case 'AUTH_LOGOUT':
      setAccessToken(null);
      return initialAuthState;
    case 'PROFILE_UPDATED':
      return { ...state, user: action.user };
    case 'TOKENS_REFRESHED':
      setAccessToken(action.tokens.accessToken);
      return { ...state, tokens: action.tokens };
    default:
      return state;
  }
}
