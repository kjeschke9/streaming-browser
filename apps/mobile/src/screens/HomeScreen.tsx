/**
 * HomeScreen — wired to /api/discovery (real backend data).
 *
 * Features:
 *  - Hero/featured banner (top title with backdrop)
 *  - Multiple content rails (Trending, New Arrivals, genre-specific)
 *  - Server-side exclusion engine applied; hiddenCount banner shown
 *  - Long-press any card → hide-title bottom sheet
 *  - Pull-to-refresh
 *  - Loading skeleton + error state
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector }  from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { getApiClient }               from '../store/apiClient';
import { DiscoveryApi }               from '@streaming/api-client';
import type { DiscoveryRail }         from '@streaming/api-client';
import type { Title }                 from '@streaming/types';
import { colors, spacing, typographyPresets, radius } from '@streaming/tokens';

// ── Helpers ────────────────────────────────────────────────────────────────────

const discoveryApi = new DiscoveryApi(getApiClient());

const SERVICE_COLORS: Record<string, string> = {
  netflix:    '#E50914',
  prime:      '#00A8E1',
  hulu:       '#1CE783',
  disney:     '#113CCF',
  hbo:        '#5822E0',
  apple:      '#555555',
  peacock:    '#E08700',
  paramount:  '#0064FF',
  crunchyroll:'#F47521',
};

const SERVICE_LABELS: Record<string, string> = {
  netflix:    'N', prime: 'P', hulu: 'H', disney: 'D+',
  hbo:        'Max', apple: '🍎', peacock: '🦚', paramount: 'P+', crunchyroll: 'CR',
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface HiddenBanner { railId: string; count: number; }

// ── Sub-components ─────────────────────────────────────────────────────────────

const TitleCard: React.FC<{
  item: Title;
  onLongPress: (title: Title) => void;
}> = ({ item, onLongPress }) => (
  <TouchableOpacity
    style={styles.card}
    onLongPress={() => onLongPress(item)}
    activeOpacity={0.85}
  >
    <Image
      source={{ uri: item.posterUrl }}
      style={styles.cardImage}
      resizeMode="cover"
    />
    <View
      style={[
        styles.serviceBadge,
        { backgroundColor: SERVICE_COLORS[item.serviceId] ?? '#444' },
      ]}
    >
      <Text style={styles.serviceBadgeText}>
        {SERVICE_LABELS[item.serviceId] ?? item.serviceId}
      </Text>
    </View>
    <View style={styles.cardMeta}>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardYear}>{item.year}</Text>
    </View>
  </TouchableOpacity>
);

const Rail: React.FC<{
  rail: DiscoveryRail;
  onLongPress: (title: Title) => void;
}> = ({ rail, onLongPress }) => (
  <View style={styles.rail}>
    <View style={styles.railHeader}>
      <Text style={styles.railLabel}>{rail.label}</Text>
      {rail.hiddenCount > 0 && (
        <Text style={styles.railHidden}>{rail.hiddenCount} hidden</Text>
      )}
    </View>
    <FlatList
      data={rail.titles}
      keyExtractor={t => t.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing[4] }}
      ItemSeparatorComponent={() => <View style={{ width: spacing[3] }} />}
      renderItem={({ item }) => (
        <TitleCard item={item} onLongPress={onLongPress} />
      )}
    />
  </View>
);

const SkeletonRail: React.FC = () => (
  <View style={styles.rail}>
    <View style={[styles.skeletonLine, { width: 140, marginLeft: spacing[4], marginBottom: spacing[3] }]} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing[4] }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={[styles.skeletonCard, i > 0 && { marginLeft: spacing[3] }]} />
      ))}
    </ScrollView>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const dispatch = useDispatch<AppDispatch>();

  const [rails, setRails]           = useState<DiscoveryRail[]>([]);
  const [featured, setFeatured]     = useState<Title | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);

  // Hero backdrop fade-in
  const heroOpacity = useRef(new Animated.Value(0)).current;

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);

      const [railsData, featuredData] = await Promise.all([
        discoveryApi.getRails({ limit: 20 }),
        discoveryApi.getFeatured(),
      ]);

      setRails(railsData.rails);
      setFeatured(featuredData.featured);

      // Fade in hero backdrop
      Animated.timing(heroOpacity, {
        toValue: 1, duration: 600, useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load content. Check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Long-press → hide title ────────────────────────────────────────────────
  const handleLongPress = useCallback((title: Title) => {
    Alert.alert(
      'Hide This Title?',
      `"${title.title}" will be hidden from all your lists. You can restore it in Settings → Hidden Content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide',
          style: 'destructive',
          onPress: async () => {
            try {
              await getApiClient().post('/api/exclusion/hidden-titles', {
                titleId:    title.id,
                serviceId:  title.serviceId,
                externalId: title.externalId,
                titleName:  title.title,
                posterUrl:  title.posterUrl,
              });
              // Refresh rails to reflect the change
              fetchData(true);
            } catch {
              Alert.alert('Error', 'Could not hide this title. Please try again.');
            }
          },
        },
      ]
    );
  }, [fetchData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <ScrollView style={styles.container} scrollEnabled={false}>
        <View style={styles.skeletonHero} />
        <SkeletonRail />
        <SkeletonRail />
        <SkeletonRail />
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchData()}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalHidden = rails.reduce((sum, r) => sum + r.hiddenCount, 0);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchData(true)}
          tintColor={colors.brand.purple}
        />
      }
    >
      {/* ── Hero Banner ── */}
      {featured ? (
        <View style={styles.hero}>
          <Animated.Image
            source={{ uri: featured.backdropUrl ?? featured.posterUrl }}
            style={[styles.heroImage, { opacity: heroOpacity }]}
            resizeMode="cover"
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.heroBadge, { backgroundColor: SERVICE_COLORS[featured.serviceId] ?? '#444' }]}>
              <Text style={styles.heroBadgeText}>
                {SERVICE_LABELS[featured.serviceId] ?? featured.serviceId}
              </Text>
            </View>
            <Text style={styles.heroTitle}>{featured.title}</Text>
            <Text style={styles.heroMeta}>
              {featured.year} · {featured.rating} · {featured.genres.slice(0, 3).join(', ')}
            </Text>
            <Text style={styles.heroDesc} numberOfLines={2}>{featured.description}</Text>
            <TouchableOpacity style={styles.playBtn}>
              <Text style={styles.playBtnText}>▶  Play</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.heroPlaceholder}>
          <Text style={styles.heroPlaceholderText}>StreamHub</Text>
        </View>
      )}

      {/* ── Hidden count banner ── */}
      {totalHidden > 0 && (
        <View style={styles.hiddenBanner}>
          <Text style={styles.hiddenBannerText}>
            🛡️ {totalHidden} title{totalHidden !== 1 ? 's' : ''} hidden by your exclusion rules
          </Text>
        </View>
      )}

      {/* ── Content Rails ── */}
      {rails.map(rail =>
        rail.titles.length > 0 ? (
          <Rail key={rail.id} rail={rail} onLongPress={handleLongPress} />
        ) : null
      )}

      <View style={{ height: spacing[8] }} />
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[6] },

  // Hero
  hero:         { height: 340, width: '100%', position: 'relative' },
  heroImage:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  heroOverlay:  {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  heroContent:  { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing[5] },
  heroBadge:    {
    alignSelf: 'flex-start', paddingHorizontal: spacing[2], paddingVertical: 2,
    borderRadius: radius.sm, marginBottom: spacing[2],
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  heroTitle:    { color: colors.text[50], fontSize: 28, fontWeight: '800', marginBottom: spacing[1] },
  heroMeta:     { color: colors.text[300], fontSize: 13, marginBottom: spacing[2] },
  heroDesc:     { color: colors.text[200], fontSize: 13, lineHeight: 18, marginBottom: spacing[4] },
  playBtn:      {
    backgroundColor: colors.brand.purple, borderRadius: radius.md,
    paddingVertical: spacing[3], paddingHorizontal: spacing[6],
    alignSelf: 'flex-start',
  },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  heroPlaceholder: {
    height: 200, backgroundColor: colors.bg[800],
    alignItems: 'center', justifyContent: 'center',
  },
  heroPlaceholderText: { color: colors.text[400], fontSize: 32, fontWeight: '800' },

  // Hidden banner
  hiddenBanner: {
    backgroundColor: colors.safeFeed.amber + '22',
    borderLeftWidth: 3, borderLeftColor: colors.safeFeed.amber,
    paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    marginHorizontal: spacing[4], marginTop: spacing[4],
    borderRadius: radius.sm,
  },
  hiddenBannerText: { color: colors.safeFeed.amber, fontSize: 13 },

  // Rails
  rail:       { marginTop: spacing[6] },
  railHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], marginBottom: spacing[3],
  },
  railLabel:  { color: colors.text[50], fontSize: 18, fontWeight: '700' },
  railHidden: { color: colors.text[400], fontSize: 12 },

  // Cards
  card:      { width: 130, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.bg[800] },
  cardImage: { width: 130, height: 190 },
  serviceBadge: {
    position: 'absolute', top: spacing[2], left: spacing[2],
    paddingHorizontal: 5, paddingVertical: 2,
    borderRadius: radius.xs,
  },
  serviceBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardMeta:  { padding: spacing[2] },
  cardTitle: { color: colors.text[100], fontSize: 12, fontWeight: '600' },
  cardYear:  { color: colors.text[400], fontSize: 11, marginTop: 2 },

  // Skeleton
  skeletonHero: { height: 260, backgroundColor: colors.bg[800] },
  skeletonCard: { width: 130, height: 190 + 44, borderRadius: radius.md, backgroundColor: colors.bg[800] },
  skeletonLine: { height: 18, borderRadius: 4, backgroundColor: colors.bg[800] },

  // Error
  errorIcon: { fontSize: 48, marginBottom: spacing[4] },
  errorText: { color: colors.text[200], textAlign: 'center', fontSize: 15, marginBottom: spacing[4] },
  retryBtn:  {
    backgroundColor: colors.brand.purple, borderRadius: radius.md,
    paddingVertical: spacing[3], paddingHorizontal: spacing[6],
  },
  retryText: { color: '#fff', fontWeight: '700' },
});
