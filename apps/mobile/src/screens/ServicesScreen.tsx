/**
 * ServicesScreen — shows all 9 streaming services with:
 *  - Enable/disable toggle (wired to PATCH /api/services/:id/toggle)
 *  - Sync button per service (POST /api/services/:id/sync)
 *  - Last-synced time + title count from /api/sync/status
 *  - Pull-to-refresh
 */

import React, { useCallback, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector }    from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchServices, toggleService, syncService } from '../store/slices/servicesSlice';
import { fetchSyncStatus }             from '../store/slices/syncSlice';
import type { StreamingService }       from '@streaming/types';
import { colors, spacing, radius }     from '@streaming/tokens';

const SERVICE_META: Record<string, { label: string; color: string; emoji: string }> = {
  netflix:    { label: 'Netflix',       color: '#E50914', emoji: '🔴' },
  prime:      { label: 'Prime Video',   color: '#00A8E1', emoji: '🔵' },
  hulu:       { label: 'Hulu',          color: '#1CE783', emoji: '🟢' },
  disney:     { label: 'Disney+',       color: '#113CCF', emoji: '🏰' },
  hbo:        { label: 'Max',           color: '#5822E0', emoji: '👑' },
  apple:      { label: 'Apple TV+',     color: '#555555', emoji: '🍎' },
  peacock:    { label: 'Peacock',       color: '#E08700', emoji: '🦚' },
  paramount:  { label: 'Paramount+',   color: '#0064FF', emoji: '⭐' },
  crunchyroll:{ label: 'Crunchyroll',  color: '#F47521', emoji: '🎌' },
};

function timeAgo(iso: string | undefined | null): string {
  if (!iso) return 'Never synced';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

export default function ServicesScreen() {
  const dispatch   = useDispatch<AppDispatch>();
  const { items, isLoading } = useSelector((s: RootState) => s.services);
  const { services: syncStatuses, totals } = useSelector((s: RootState) => s.sync);

  const refresh = useCallback(() => {
    dispatch(fetchServices());
    dispatch(fetchSyncStatus());
  }, [dispatch]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleToggle = useCallback(async (svc: StreamingService) => {
    await dispatch(toggleService({ serviceId: svc.id, enabled: !svc.enabled }));
  }, [dispatch]);

  const handleSync = useCallback(async (svc: StreamingService) => {
    Alert.alert(
      `Sync ${SERVICE_META[svc.id]?.label ?? svc.id}?`,
      'This will queue a catalogue refresh. It may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync Now',
          onPress: async () => {
            const result = await dispatch(syncService(svc.id));
            if (syncService.fulfilled.match(result)) {
              Alert.alert('Sync queued', 'The sync worker will update shortly.');
            } else {
              Alert.alert('Error', 'Could not start sync. Check the server.');
            }
          },
        },
      ]
    );
  }, [dispatch]);

  const renderItem = ({ item }: { item: StreamingService }) => {
    const meta       = SERVICE_META[item.id] ?? { label: item.id, color: '#666', emoji: '📺' };
    const syncStatus = syncStatuses.find(s => s.serviceId === item.id);

    return (
      <View style={[styles.row, !item.enabled && styles.rowDisabled]}>
        {/* Icon + Name */}
        <View style={[styles.iconCircle, { backgroundColor: meta.color + '22' }]}>
          <Text style={styles.iconEmoji}>{meta.emoji}</Text>
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, !item.enabled && styles.nameDisabled]}>{meta.label}</Text>
          <Text style={styles.sub}>
            {item.enabled
              ? `${syncStatus?.titleCount ?? 0} titles · Synced ${timeAgo(syncStatus?.lastSyncedAt)}`
              : 'Disabled — no content shown'}
          </Text>
          {syncStatus?.error && (
            <Text style={styles.errorText}>⚠️ {syncStatus.error}</Text>
          )}
        </View>

        {/* Sync button */}
        {item.enabled && (
          <TouchableOpacity
            style={styles.syncBtn}
            onPress={() => handleSync(item)}
          >
            <Text style={styles.syncBtnText}>↻</Text>
          </TouchableOpacity>
        )}

        {/* Toggle */}
        <Switch
          value={item.enabled}
          onValueChange={() => handleToggle(item)}
          trackColor={{ false: colors.bg[600], true: meta.color }}
          thumbColor={item.enabled ? '#fff' : colors.text[400]}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Totals banner */}
      {totals && (
        <View style={styles.totalsBanner}>
          <Text style={styles.totalsText}>
            📚 {totals.titles.toLocaleString()} total titles across{' '}
            {totals.services} active service{totals.services !== 1 ? 's' : ''}
          </Text>
          {totals.lastSync && (
            <Text style={styles.totalsSubText}>
              Last catalogue update {timeAgo(totals.lastSync)}
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing[4] }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.brand.purple}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <ActivityIndicator color={colors.brand.purple} />
            <Text style={styles.emptyText}>Loading services…</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },

  totalsBanner: {
    backgroundColor: colors.bg[800], padding: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.border.default,
  },
  totalsText:    { color: colors.text[100], fontSize: 14, fontWeight: '600' },
  totalsSubText: { color: colors.text[400], fontSize: 12, marginTop: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[900], borderRadius: radius.lg,
    padding: spacing[4],
  },
  rowDisabled: { opacity: 0.55 },

  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing[3],
  },
  iconEmoji: { fontSize: 22 },

  info:         { flex: 1 },
  name:         { color: colors.text[50], fontSize: 16, fontWeight: '700' },
  nameDisabled: { color: colors.text[400] },
  sub:          { color: colors.text[400], fontSize: 12, marginTop: 2 },
  errorText:    { color: colors.safeFeed.red, fontSize: 11, marginTop: 2 },

  syncBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.bg[700], alignItems: 'center', justifyContent: 'center',
    marginRight: spacing[3],
  },
  syncBtnText: { color: colors.text[100], fontSize: 18, fontWeight: '700' },

  separator: { height: spacing[3] },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingTop: spacing[12],
  },
  emptyText: { color: colors.text[400], marginTop: spacing[3] },
});
