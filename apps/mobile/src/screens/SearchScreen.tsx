import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Theme } from '../components/BurgundhyTheme';
import { TextInput } from '../components/TextInput';
import { TitleCard } from '../components/TitleCard';
import { useExclusionStore } from '../store';
import { searchTitles } from '@streambrws/shared-logic';
import type { ContentTitle } from '@streambrws/shared-types';
import { MOCK_TITLES } from '../services/mockData';

interface Props {
  onTitlePress: (title: ContentTitle) => void;
  onTitleLongPress: (title: ContentTitle) => void;
}

export function SearchScreen({ onTitlePress, onTitleLongPress }: Props) {
  const [query, setQuery]     = useState('');
  const exclusions            = useExclusionStore();
  const hiddenSearchEnabled   = exclusions.hiddenTitleSearchEnabled;

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchTitles(
      MOCK_TITLES as ContentTitle[],
      query,
      {
        tags: exclusions.tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
        hiddenTitles: [...exclusions.hiddenTitleIds].map((id, i) => ({
          id: String(i), userId: '', titleId: id,
          serviceId: 'netflix' as any, titleSnapshot: '', hiddenAt: '',
        })),
        hiddenTitleSearchEnabled: exclusions.hiddenTitleSearchEnabled,
        serviceToggles: exclusions.serviceToggles,
        isDirty: false,
      }
    );
  }, [query, exclusions.tags, exclusions.hiddenTitleIds, exclusions.hiddenTitleSearchEnabled]);

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search titles, genres…"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
          style={styles.input}
        />
      </View>

      {hiddenSearchEnabled && query.length > 0 && (
        <View style={styles.hiddenNote}>
          <Text style={styles.hiddenNoteText}>🔍 Hidden titles may appear in results</Text>
        </View>
      )}

      {query.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>Search your streaming library</Text>
          <Text style={styles.emptySubtitle}>Find movies and shows across all services</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>😶</Text>
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>Try different keywords or adjust your exclusion tags</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          numColumns={2}
          keyExtractor={t => `${t.serviceId}:${t.id}`}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TitleCard
              title={item}
              onPress={onTitlePress}
              onLongPress={onTitleLongPress}
              isHidden={exclusions.hiddenTitleIds.has(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Theme.bg.screen },
  searchBar: { padding: Theme.spacing.md, paddingBottom: 0 },
  input:   { marginBottom: 0 },
  hiddenNote: {
    marginHorizontal: Theme.spacing.md,
    marginTop: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: Theme.radius.sm,
  },
  hiddenNoteText: { color: Theme.colors.gold, fontSize: Theme.typography.xs },
  grid:    { padding: Theme.spacing.md },
  row:     { justifyContent: 'space-between' },
  empty:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xxxl },
  emptyIcon:     { fontSize: 48, marginBottom: Theme.spacing.md },
  emptyTitle:    { color: Theme.text.primary, fontSize: Theme.typography.lg, fontWeight: Theme.typography.weight.semiBold, textAlign: 'center' },
  emptySubtitle: { color: Theme.text.muted, fontSize: Theme.typography.sm, textAlign: 'center', marginTop: Theme.spacing.xs },
});
