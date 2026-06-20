/**
 * SyncStatusScreen — shows catalogue health for all 9 services.
 * Reads from Redux sync slice (populated from /api/sync/status).
 */

import React, { useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector }    from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { fetchSyncStatus }             from '../store/slices/syncSlice';
import { colors, spacing, radius }     from '@streaming/tokens';

const SERVICE_META: Record<string, { label: string; emoji: string }> = {
  netflix:    { label: 'Netflix',     emoji: '🔴' },
  prime:      { label: 'Prime Video', emoji: '🔵' },
  hulu:       { label: 'Hulu',        emoji: '🟢' },
  disney:     { label: 'Disney+',     emoji: '🏰' },
  hbo:        { label: 'Max',         emoji: '👑' },
  apple:      { label: 'Apple TV+',   emoji: '🍎' },
  peacock:    { label: 'Peacock',     emoji: '🦚' },
  paramount:  { label: 'Paramount+',  emoji: '⭐' },
  crunchyroll:{ label: 'Crunchyroll', emoji: '🎌' },
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 0)  return `${mins}m ago`;
  return 'Just now';
}

export default function SyncStatusScreen() {
  const dispatch   = useDispatch<AppDispatch>();
  const { services, totals, isLoading } = useSelector((s: RootState) => s.sync);

  useEffect(() => { dispatch(fetchSyncStatus()); }, [dispatch]);

  return (
    <View style={styles.container}>
      {totals && (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            📚 {totals.titles.toLocaleString()} titles catalogued
          </Text>
          <Text style={styles.headerSub}>
            Last update {timeAgo(totals.lastSync)}
          </Text>
        </View>
      )}

      <FlatList
        data={services}
        keyExtractor={i => i.serviceId}
        contentContainerStyle={{ padding: spacing[4] }}
        ItemSeparatorComponent={() => <View style={{ height: spacing[3] }} />}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => dispatch(fetchSyncStatus())}
            tintColor={colors.brand.purple}
          />
        }
        renderItem={({ item }) => {
          const meta    = SERVICE_META[item.serviceId] ?? { label: item.serviceId, emoji: '📺' };
          const hasErr  = Boolean(item.error);
          const hasTitles = item.titleCount > 0;

          return (
            <View style={[styles.row, hasErr && styles.rowError]}>
              <Text style={styles.emoji}>{meta.emoji}</Text>
              <View style={styles.info}>
                <Text style={styles.name}>{meta.label}</Text>
                <Text style={styles.sub}>
                  {hasTitles
                    ? `${item.titleCount} titles · synced ${timeAgo(item.lastSyncedAt)}`
                    : 'No titles synced yet'}
                </Text>
                {item.durationMs && (
                  <Text style={styles.sub2}>
                    Last run: {(item.durationMs / 1000).toFixed(1)}s
                    {item.upserted !== null ? ` · ${item.upserted} upserted` : ''}
                    {item.staled   !== null ? ` · ${item.staled} staled`    : ''}
                  </Text>
                )}
                {hasErr && (
                  <Text style={styles.errorText} numberOfLines={2}>⚠️ {item.error}</Text>
                )}
              </View>
              <View style={[
                styles.statusDot,
                { backgroundColor: hasErr
                    ? colors.safeFeed.red
                    : hasTitles
                      ? colors.safeFeed.green
                      : colors.text[600] }
              ]} />
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },

  header: {
    backgroundColor: colors.bg[900], padding: spacing[5],
    borderBottomWidth: 1, borderBottomColor: colors.border.default,
  },
  headerTitle: { color: colors.text[50],  fontSize: 16, fontWeight: '700' },
  headerSub:   { color: colors.text[400], fontSize: 12, marginTop: 2 },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[900], borderRadius: radius.lg,
    padding: spacing[4],
  },
  rowError: { borderWidth: 1, borderColor: colors.safeFeed.red + '44' },

  emoji: { fontSize: 24, marginRight: spacing[3] },
  info:  { flex: 1 },
  name:  { color: colors.text[50],  fontSize: 15, fontWeight: '700' },
  sub:   { color: colors.text[400], fontSize: 12, marginTop: 2 },
  sub2:  { color: colors.text[500], fontSize: 11, marginTop: 1 },
  errorText: { color: colors.safeFeed.red, fontSize: 12, marginTop: 3 },

  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: spacing[3] },
});
