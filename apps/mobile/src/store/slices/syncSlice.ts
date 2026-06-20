/**
 * syncSlice.ts — Redux slice for sync status state.
 * Populated from GET /api/sync/status.
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getApiClient } from '../apiClient';

export interface ServiceSyncStatus {
  serviceId:    string;
  lastSyncedAt: string | null;
  titleCount:   number;
  error:        string | null;
  durationMs:   number | null;
  upserted:     number | null;
  staled:       number | null;
}

export interface SyncTotals {
  titles:   number;
  services: number;
  lastSync: string | null;
}

interface SyncState {
  services:  ServiceSyncStatus[];
  totals:    SyncTotals | null;
  isLoading: boolean;
  error:     string | null;
}

const initialState: SyncState = {
  services:  [],
  totals:    null,
  isLoading: false,
  error:     null,
};

export const fetchSyncStatus = createAsyncThunk(
  'sync/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const res = await getApiClient().get<{
        data: { services: ServiceSyncStatus[]; totals: SyncTotals };
      }>('/api/sync/status');
      return res.data.data;
    } catch (err: any) {
      return rejectWithValue(err?.message ?? 'Failed to fetch sync status');
    }
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(fetchSyncStatus.pending, state => {
      state.isLoading = true;
      state.error     = null;
    });
    builder.addCase(fetchSyncStatus.fulfilled, (state, action) => {
      state.services  = action.payload.services;
      state.totals    = action.payload.totals;
      state.isLoading = false;
    });
    builder.addCase(fetchSyncStatus.rejected, (state, action) => {
      state.isLoading = false;
      state.error     = action.payload as string;
    });
  },
});

export default syncSlice.reducer;
