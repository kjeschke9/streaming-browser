import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { Theme } from '../components/BurgundhyTheme';
import { useExclusionStore } from '../store';
import { profileApi } from '@streambrws/shared-logic';
import { MOCK_TITLES } from '../services/mockData';
import type { ContentTitle } from '@streambrws/shared-types';

export function HiddenTitlesScreen() {
  const { hiddenTitleIds, unhideTitle } = useExclusionStore();

  const hiddenTitles = MOCK_TITLES.filter(t => hiddenTitleIds.has(t.id)) as ContentTitle[];

  const handleUnhide = (title: ContentTitle) => {
    Alert.alert(
      'Unhide Title',
      `Show "${title.title}" in your feed again?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unhide',
          onPress: async () => {
            unhideTitle(title.id);
            await profileApi.unhideTitle(title.id);
          },
        },
      ]
    );
  };

  if (hiddenTitles.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>👁️</Text>
        <Text style={styles.emptyTitle}>No hidden titles</Text>
        <Text style={styles.emptySubtitle}>
          Long-press any title and choose "Hide" to remove it from your feed.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      data={hiddenTitles}
      keyExtractor={t => t.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={[styles.serviceDot, { backgroundColor: Theme.colors.service[item.serviceId] ?? Theme.colors.burgundy500 }]} />
          <View style={styles.info}>
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.metaText}>
              {item.serviceId.replace('_', ' ')} · {item.year} · {item.rating}
            </Text>
          </View>
          <TouchableOpacity style={styles.unhideBtn} onPress={() => handleUnhide(item)}>
            <Text style={styles.unhideBtnText}>Unhide</Text>
          </TouchableOpacity>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Theme.bg.screen },
  list:   { padding: Theme.spacing.md },
  row:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Theme.bg.card, borderRadius: Theme.radius.md,
    padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.border.default,
  },
  serviceDot: { width: 12, height: 12, borderRadius: 6, marginRight: Theme.spacing.sm },
  info:       { flex: 1 },
  titleText:  { color: Theme.text.primary, fontSize: Theme.typography.md, fontWeight: Theme.typography.weight.semiBold },
  metaText:   { color: Theme.text.muted, fontSize: Theme.typography.xs, marginTop: 2, textTransform: 'capitalize' },
  unhideBtn: {
    backgroundColor: Theme.colors.burgundy500, borderRadius: Theme.radius.sm,
    paddingHorizontal: Theme.spacing.sm, paddingVertical: 6,
  },
  unhideBtnText: { color: Theme.colors.white, fontSize: Theme.typography.xs, fontWeight: Theme.typography.weight.bold },
  sep: { height: Theme.spacing.sm },
  empty: { flex: 1, backgroundColor: Theme.bg.screen, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xxxl },
  emptyIcon:     { fontSize: 48, marginBottom: Theme.spacing.md },
  emptyTitle:    { color: Theme.text.primary, fontSize: Theme.typography.lg, fontWeight: Theme.typography.weight.semiBold, textAlign: 'center' },
  emptySubtitle: { color: Theme.text.muted, fontSize: Theme.typography.sm, textAlign: 'center', marginTop: Theme.spacing.xs, lineHeight: 20 },
});
