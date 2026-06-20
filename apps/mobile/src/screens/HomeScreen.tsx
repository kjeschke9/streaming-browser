import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { Theme } from '../components/BurgundhyTheme';
import { TitleCard } from '../components/TitleCard';
import { SafeFeedBanner } from '../components/SafeFeedBanner';
import { useExclusionStore, useSafeFeedStore } from '../store';
import { applyExclusions, applySafeFeed } from '@streambrws/shared-logic';
import type { ContentTitle, ServiceId } from '@streambrws/shared-types';
import { MOCK_TITLES } from '../services/mockData';

const { width: W } = Dimensions.get('window');

interface Props {
  onTitlePress: (title: ContentTitle) => void;
  onTitleLongPress: (title: ContentTitle) => void;
  onUnlockSafeFeed: () => void;
}

const SERVICE_FILTERS: { id: ServiceId | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'hulu', label: 'Hulu' },
  { id: 'hbo_max', label: 'HBO Max' },
  { id: 'disney_plus', label: 'Disney+' },
  { id: 'amazon_prime', label: 'Prime' },
  { id: 'apple_tv', label: 'Apple TV+' },
];

export function HomeScreen({ onTitlePress, onTitleLongPress, onUnlockSafeFeed }: Props) {
  const [activeService, setActiveService] = useState<ServiceId | 'all'>('all');
  const [refreshing, setRefreshing]       = useState(false);
  const exclusions  = useExclusionStore();
  const safeFeed    = useSafeFeedStore();

  const filtered = useMemo(() => {
    let titles = MOCK_TITLES as ContentTitle[];
    // Service filter chip
    if (activeService !== 'all') {
      titles = titles.filter(t => t.serviceId === activeService);
    }
    // Apply exclusions
    titles = applyExclusions(titles, {
      tags: exclusions.tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
      hiddenTitles: [...exclusions.hiddenTitleIds].map((id, i) => ({
        id: String(i), userId: '', titleId: id,
        serviceId: 'netflix' as ServiceId, titleSnapshot: '', hiddenAt: '',
      })),
      hiddenTitleSearchEnabled: exclusions.hiddenTitleSearchEnabled,
      serviceToggles: exclusions.serviceToggles,
      isDirty: false,
    });
    // Apply safe feed
    if (safeFeed.enabled && !safeFeed.isUnlocked) {
      titles = applySafeFeed(titles, {
        enabled: safeFeed.enabled,
        hasPinSet: safeFeed.hasPinSet,
        allowedServiceIds: safeFeed.allowedServiceIds,
        allowedTags: safeFeed.allowedTags,
      }, safeFeed.isUnlocked);
    }
    return titles;
  }, [activeService, exclusions.tags, exclusions.hiddenTitleIds, exclusions.serviceToggles, safeFeed]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <SafeFeedBanner onUnlock={onUnlockSafeFeed} />

      {/* Service filter tabs */}
      <FlatList
        data={SERVICE_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={i => i.id}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, activeService === item.id && styles.filterChipActive]}
            onPress={() => setActiveService(item.id)}
          >
            <Text style={[styles.filterText, activeService === item.id && styles.filterTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Title grid */}
      <FlatList
        data={filtered}
        numColumns={2}
        keyExtractor={t => `${t.serviceId}:${t.id}`}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Theme.colors.gold} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No titles match your current filters.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TitleCard
            title={item}
            onPress={onTitlePress}
            onLongPress={onTitleLongPress}
            isHidden={exclusions.hiddenTitleIds.has(item.id)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.bg.screen },
  filterBar: { maxHeight: 52, flexGrow: 0 },
  filterContent: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, gap: Theme.spacing.sm },
  filterChip: {
    paddingHorizontal: Theme.spacing.md, paddingVertical: 7,
    borderRadius: Theme.radius.full, backgroundColor: Theme.bg.card,
    borderWidth: 1, borderColor: Theme.border.default,
  },
  filterChipActive: { backgroundColor: Theme.colors.burgundy500, borderColor: Theme.colors.burgundy500 },
  filterText: { color: Theme.text.secondary, fontSize: Theme.typography.sm, fontWeight: Theme.typography.weight.medium },
  filterTextActive: { color: Theme.colors.white },
  grid: { padding: Theme.spacing.md, paddingTop: Theme.spacing.sm },
  row: { justifyContent: 'space-between' },
  empty: { flex: 1, alignItems: 'center', paddingTop: Theme.spacing.xxxl },
  emptyText: { color: Theme.text.muted, fontSize: Theme.typography.md },
});
