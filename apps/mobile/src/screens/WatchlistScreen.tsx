/**
 * WatchlistScreen — shows all bookmarked titles.
 * Accessible from Settings → My Watchlist.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation }      from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getApiClient }       from '../store/apiClient';
import { colors, spacing, radius } from '@streaming/tokens';
import { serviceIdToColor, serviceIdToLabel } from '../utils/deepLinks';
import type { RootStackParamList } from '../navigation/types';
import type { Title }              from '@streaming/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface WatchlistEntry {
  id:        string;
  title_id:  string;
  title:     string;
  poster_url:string;
  service_id:string;
  year:      number;
  rating:    string;
  type:      string;
  added_at:  string;
}

export default function WatchlistScreen() {
  const navigation = useNavigation<Nav>();

  const [items, setItems]       = useState<WatchlistEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchList = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const res = await getApiClient().get<{ data: { watchlist: WatchlistEntry[] } }>('/api/watchlist');
      setItems(res.data.data.watchlist);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleRemove = useCallback((item: WatchlistEntry) => {
    Alert.alert(
      'Remove from Watchlist?',
      `"${item.title}" will be removed from your watchlist.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            try {
              await getApiClient().delete(`/api/watchlist/${item.title_id}`);
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch {
              Alert.alert('Error', 'Could not remove item.');
            }
          },
        },
      ]
    );
  }, []);

  const renderItem = ({ item }: { item: WatchlistEntry }) => {
    const svcColor = serviceIdToColor(item.service_id as any);
    const svcLabel = serviceIdToLabel(item.service_id as any);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          navigation.navigate('TitleDetail', { titleId: item.title_id })
        }
        onLongPress={() => handleRemove(item)}
      >
        <Image source={{ uri: item.poster_url }} style={styles.poster} resizeMode="cover" />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          <View style={[styles.svcBadge, { backgroundColor: svcColor }]}>
            <Text style={styles.svcText}>{svcLabel}</Text>
          </View>
          <Text style={styles.meta}>{item.year} · {item.rating}</Text>
        </View>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item)}>
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing[2] }} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchList(true)}
            tintColor={colors.brand.purple}
          />
        }
        ListEmptyComponent={
          loading ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyTitle}>No saved titles yet</Text>
              <Text style={styles.emptySub}>
                Tap the Watchlist button on any title to save it here.
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },
  list:      { padding: spacing[4] },

  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[800], borderRadius: radius.lg,
    overflow: 'hidden', gap: spacing[3],
  },
  poster: { width: 64, height: 96 },
  info:   { flex: 1, paddingVertical: spacing[3], gap: spacing[2] },
  title:  { color: colors.text[50], fontSize: 15, fontWeight: '700' },
  svcBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 2,
    borderRadius: radius.xs,
  },
  svcText:  { color: '#fff', fontSize: 10, fontWeight: '700' },
  meta:     { color: colors.text[400], fontSize: 12 },

  removeBtn: {
    padding: spacing[4], alignItems: 'center', justifyContent: 'center',
  },
  removeText: { color: colors.text[500], fontSize: 16 },

  empty:      { alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyIcon:  { fontSize: 48, marginBottom: spacing[4] },
  emptyTitle: { color: colors.text[100], fontSize: 18, fontWeight: '700', marginBottom: spacing[2] },
  emptySub:   { color: colors.text[400], fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
