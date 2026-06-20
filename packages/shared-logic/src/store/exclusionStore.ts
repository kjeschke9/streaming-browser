import type { ExclusionSettings, HiddenTitle, ExclusionTag, ServiceId } from '@streambrws/shared-types';

export interface ExclusionState {
  tags: ExclusionTag[];
  hiddenTitles: HiddenTitle[];
  hiddenTitleSearchEnabled: boolean;
  serviceToggles: Partial<Record<ServiceId, boolean>>;
  lastSyncedAt?: string;
  isDirty: boolean;
}

export const initialExclusionState: ExclusionState = {
  tags: [],
  hiddenTitles: [],
  hiddenTitleSearchEnabled: false,
  serviceToggles: {},
  isDirty: false,
};

export type ExclusionAction =
  | { type: 'SET_FROM_PROFILE'; settings: ExclusionSettings; toggles: Partial<Record<ServiceId, boolean>> }
  | { type: 'ADD_TAG'; tag: ExclusionTag }
  | { type: 'REMOVE_TAG'; tagId: string }
  | { type: 'HIDE_TITLE'; title: HiddenTitle }
  | { type: 'UNHIDE_TITLE'; hiddenId: string }
  | { type: 'SET_HIDDEN_SEARCH'; enabled: boolean }
  | { type: 'TOGGLE_SERVICE'; serviceId: ServiceId; enabled: boolean }
  | { type: 'MARK_SYNCED'; timestamp: string };

export function exclusionReducer(state: ExclusionState, action: ExclusionAction): ExclusionState {
  switch (action.type) {
    case 'SET_FROM_PROFILE':
      return {
        ...state,
        tags: action.settings.tags,
        hiddenTitles: action.settings.hiddenTitles,
        hiddenTitleSearchEnabled: action.settings.hiddenTitleSearchEnabled,
        serviceToggles: action.toggles,
        lastSyncedAt: action.settings.lastSyncedAt,
        isDirty: false,
      };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag], isDirty: true };
    case 'REMOVE_TAG':
      return { ...state, tags: state.tags.filter(t => t.id !== action.tagId), isDirty: true };
    case 'HIDE_TITLE':
      return { ...state, hiddenTitles: [...state.hiddenTitles, action.title], isDirty: true };
    case 'UNHIDE_TITLE':
      return { ...state, hiddenTitles: state.hiddenTitles.filter(h => h.id !== action.hiddenId), isDirty: true };
    case 'SET_HIDDEN_SEARCH':
      return { ...state, hiddenTitleSearchEnabled: action.enabled, isDirty: true };
    case 'TOGGLE_SERVICE':
      return {
        ...state,
        serviceToggles: { ...state.serviceToggles, [action.serviceId]: action.enabled },
        isDirty: true,
      };
    case 'MARK_SYNCED':
      return { ...state, lastSyncedAt: action.timestamp, isDirty: false };
    default:
      return state;
  }
}

// ─── Filter helpers ───────────────────────────────────────────────────────────
import type { ContentTitle } from '@streambrws/shared-types';

export function filterTitles(
  titles: ContentTitle[],
  state: ExclusionState,
  isSearch = false
): ContentTitle[] {
  const hiddenIds = new Set(state.hiddenTitles.map(h => h.titleId));
  const tagSet = new Set(state.tags.map(t => t.tag.toLowerCase()));
  const enabledServices = Object.entries(state.serviceToggles)
    .filter(([, v]) => v !== false)
    .map(([k]) => k as ServiceId);

  return titles.filter(title => {
    // Service toggle
    if (state.serviceToggles[title.serviceId] === false) return false;

    // Hidden titles: in search mode, show if hiddenTitleSearchEnabled
    if (hiddenIds.has(title.id)) {
      return isSearch && state.hiddenTitleSearchEnabled;
    }

    // Exclusion tags — match against genres + tags
    const allLabels = [...title.genres, ...title.tags].map(l => l.toLowerCase());
    if (allLabels.some(label => tagSet.has(label))) return false;

    return true;
  });
}
