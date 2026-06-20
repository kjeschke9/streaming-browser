import type { SafeFeedConfig } from '@streambrws/shared-types';

export interface SafeFeedState {
  config: SafeFeedConfig;
  isUnlocked: boolean;
  unlockError: string | null;
}

export const initialSafeFeedState: SafeFeedState = {
  config: {
    enabled: false,
    hasPinSet: false,
    allowedServiceIds: [],
    allowedTags: [],
  },
  isUnlocked: false,
  unlockError: null,
};

export type SafeFeedAction =
  | { type: 'SET_CONFIG'; config: SafeFeedConfig }
  | { type: 'UNLOCK_SUCCESS' }
  | { type: 'UNLOCK_FAIL'; error: string }
  | { type: 'LOCK' }
  | { type: 'TOGGLE_ENABLED'; enabled: boolean }
  | { type: 'PIN_SET' };

export function safeFeedReducer(state: SafeFeedState, action: SafeFeedAction): SafeFeedState {
  switch (action.type) {
    case 'SET_CONFIG':
      return { ...state, config: action.config };
    case 'UNLOCK_SUCCESS':
      return { ...state, isUnlocked: true, unlockError: null };
    case 'UNLOCK_FAIL':
      return { ...state, isUnlocked: false, unlockError: action.error };
    case 'LOCK':
      return { ...state, isUnlocked: false, unlockError: null };
    case 'TOGGLE_ENABLED':
      return { ...state, config: { ...state.config, enabled: action.enabled } };
    case 'PIN_SET':
      return { ...state, config: { ...state.config, hasPinSet: true } };
    default:
      return state;
  }
}
