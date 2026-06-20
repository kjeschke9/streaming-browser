/**
 * TitleDetailScreen — full-page detail view for a title.
 *
 * Features:
 *  - Full backdrop hero with gradient overlay
 *  - Genre pills, rating badge, year/runtime
 *  - Service-specific "Watch on X" button (deep link)
 *  - "Open in App" button (launches native app or falls back to web)
 *  - Long-press → hide this title
 *  - Bookmark/save to watchlist
 *  - Safe-Feed badge if title would normally be filtered
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp }     from '@react-navigation/native';
import type { NativeStackNavigationProp }         from '@react-navigation/native-stack';
import { useDispatch }                            from 'react-redux';
import type { AppDispatch }                       from '../store';
import { getApiClient }                           from '../store/apiClient';
import { colors, spacing, radius, typographyPresets } from '@streaming/tokens';
import {
  resolveDeepLink,
  openInNativeApp,
  serviceIdToLabel,
  serviceIdToColor,
}                                                 from '../utils/deepLinks';
import type { Title }                             from '@streaming/types';
import type { RootStackParamList }                from '../navigation/types';

type DetailRoute = RouteProp<RootStackParamList, 'TitleDetail'>;
type Nav         = NativeStackNavigationProp<RootStackParamList>;

// ─── Rating colour map ────────────────────────────────────────────────────────

const RATING_COLOR: Record<string, string> = {
  'G':      '#22c55e', 'TV-G':   '#22c55e', 'TV-Y':   '#22c55e', 'TV-Y7':  '#22c55e',
  'PG':     '#84cc16', 'TV-PG':  '#84cc16',
  'PG-13':  '#eab308', 'TV-14':  '#eab308',
  'R':      '#f97316', 'TV-MA':  '#ef4444', 'NC-17':  '#ef4444',
};

export default function TitleDetailScreen() {
  const route      = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const dispatch   = useDispatch<AppDispatch>();

  // Title can be passed directly via route params or fetched by ID
  const { title: routeTitle, titleId } = route.params ?? {};

  const [title, setTitle]           = useState<Title | null>(routeTitle ?? null);
  const [loading, setLoading]       = useState(!routeTitle);
  const [watchUrl, setWatchUrl]     = useState<string | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [hiding, setHiding]         = useState(false);

  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  // ── Fetch title if not passed inline ──────────────────────────────────────
  useEffect(() => {
    if (title) return;
    if (!titleId) { setLoading(false); return; }

    getApiClient()
      .get<{ data: { title: Title } }>(`/api/titles/${titleId}`)
      .then(res => setTitle(res.data.data.title))
      .catch(() => setLoading(false))
      .finally(() => setLoading(false));
  }, [titleId]);

  // ── Resolve watch URL ────────────────────────────────────────────────────
  useEffect(() => {
    if (!title) return;
    resolveDeepLink(title.serviceId, title.title).then(r => setWatchUrl(r.url));
  }, [title]);

  // ── Fade in backdrop ─────────────────────────────────────────────────────
  const onBackdropLoad = useCallback(() => {
    Animated.timing(backdropOpacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();
  }, [backdropOpacity]);

  // ── Hide title ───────────────────────────────────────────────────────────
  const handleHide = useCallback(async () => {
    if (!title) return;
    Alert.alert(
      'Hide This Title?',
      `"${title.title}" will be removed from all your lists. You can restore it in Settings → Hidden Content.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide', style: 'destructive',
          onPress: async () => {
            setHiding(true);
            try {
              await getApiClient().post('/api/exclusion/hidden-titles', {
                titleId:    title.id,
                serviceId:  title.serviceId,
                externalId: title.externalId,
                titleName:  title.title,
                posterUrl:  title.posterUrl,
              });
              navigation.goBack();
            } catch {
              Alert.alert('Error', 'Could not hide this title. Please try again.');
            } finally {
              setHiding(false);
            }
          },
        },
      ]
    );
  }, [title, navigation]);

  // ── Bookmark ─────────────────────────────────────────────────────────────
  const handleBookmark = useCallback(async () => {
    if (!title) return;
    try {
      if (bookmarked) {
        await getApiClient().delete(`/api/watchlist/${title.id}`);
      } else {
        await getApiClient().post('/api/watchlist', { titleId: title.id });
      }
      setBookmarked(b => !b);
    } catch {
      Alert.alert('Error', 'Could not update your watchlist.');
    }
  }, [title, bookmarked]);

  // ── Open in native app ────────────────────────────────────────────────────
  const handleOpenApp = useCallback(async () => {
    if (!title) return;
    const result = await openInNativeApp(title.serviceId, title.title);
    if (result === 'store') {
      Alert.alert(
        `${serviceIdToLabel(title.serviceId)} not installed`,
        'We opened the app store so you can install it.',
      );
    }
  }, [title]);

  // ── Share ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    if (!title) return;
    await Share.share({
      title:   title.title,
      message: `Watch "${title.title}" (${title.year}) on ${serviceIdToLabel(title.serviceId)}\n${watchUrl ?? ''}`,
    });
  }, [title, watchUrl]);

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.brand.purple} size="large" />
      </View>
    );
  }

  if (!title) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Title not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const svcColor  = serviceIdToColor(title.serviceId);
  const svcLabel  = serviceIdToLabel(title.serviceId);
  const ratingClr = RATING_COLOR[title.rating] ?? '#94a3b8';

  return (
    <ScrollView style={styles.container} bounces>
      {/* ── Backdrop ── */}
      <View style={styles.backdropContainer}>
        {title.backdropUrl ? (
          <Animated.Image
            source={{ uri: title.backdropUrl }}
            style={[styles.backdrop, { opacity: backdropOpacity }]}
            resizeMode="cover"
            onLoad={onBackdropLoad}
          />
        ) : (
          <Image
            source={{ uri: title.posterUrl }}
            style={styles.backdrop}
            resizeMode="cover"
          />
        )}
        {/* Gradient scrim — semi-transparent overlay */}
        <View style={styles.backdropScrim} />

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>↑</Text>
        </TouchableOpacity>
      </View>

      {/* ── Poster + Meta ── */}
      <View style={styles.metaRow}>
        <Image
          source={{ uri: title.posterUrl }}
          style={styles.poster}
          resizeMode="cover"
        />
        <View style={styles.metaInfo}>
          <Text style={styles.titleText}>{title.title}</Text>

          <View style={styles.pillRow}>
            <View style={[styles.ratingPill, { borderColor: ratingClr }]}>
              <Text style={[styles.ratingPillText, { color: ratingClr }]}>{title.rating}</Text>
            </View>
            <Text style={styles.yearText}>{title.year}</Text>
            {title.type === 'movie' && title.duration && (
              <Text style={styles.yearText}>{title.duration} min</Text>
            )}
            {title.type === 'series' && title.seasons && (
              <Text style={styles.yearText}>{title.seasons} season{title.seasons !== 1 ? 's' : ''}</Text>
            )}
          </View>

          {/* Service badge */}
          <View style={[styles.svcBadge, { backgroundColor: svcColor }]}>
            <Text style={styles.svcBadgeText}>{svcLabel}</Text>
          </View>
        </View>
      </View>

      {/* ── Genre pills ── */}
      {title.genres.length > 0 && (
        <View style={styles.genreRow}>
          {title.genres.map(g => (
            <View key={g} style={styles.genrePill}>
              <Text style={styles.genrePillText}>{g}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Description ── */}
      <Text style={styles.description}>{title.description}</Text>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        {/* Primary: open service web search */}
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: svcColor }]}
          onPress={() => watchUrl && Linking.openURL(watchUrl)}
          disabled={!watchUrl}
        >
          <Text style={styles.primaryBtnText}>▶  Watch on {svcLabel}</Text>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          {/* Open native app */}
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleOpenApp}>
            <Text style={styles.secondaryBtnText}>📱 Open App</Text>
          </TouchableOpacity>

          {/* Bookmark */}
          <TouchableOpacity
            style={[styles.secondaryBtn, bookmarked && styles.secondaryBtnActive]}
            onPress={handleBookmark}
          >
            <Text style={styles.secondaryBtnText}>
              {bookmarked ? '🔖 Saved' : '+ Watchlist'}
            </Text>
          </TouchableOpacity>

          {/* Hide */}
          <TouchableOpacity
            style={[styles.secondaryBtn, styles.dangerBtn]}
            onPress={handleHide}
            disabled={hiding}
          >
            <Text style={styles.secondaryBtnText}>🙈 Hide</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom spacing ── */}
      <View style={{ height: spacing[10] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },
  centered:  { alignItems: 'center', justifyContent: 'center', flex: 1 },

  backdropContainer: { height: 240, width: '100%', position: 'relative' },
  backdrop:          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  backdropScrim: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(10,10,20,0.6)',
  },
  backBtn: {
    position: 'absolute', top: 48, left: spacing[4],
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText:  { color: '#fff', fontSize: 26, lineHeight: 30 },
  shareBtn: {
    position: 'absolute', top: 48, right: spacing[4],
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 18, lineHeight: 22 },

  metaRow: {
    flexDirection: 'row', padding: spacing[4], gap: spacing[4],
    marginTop: -60,   // overlap the backdrop
  },
  poster: {
    width: 100, height: 150, borderRadius: radius.md,
    borderWidth: 2, borderColor: colors.bg[800],
  },
  metaInfo: { flex: 1, paddingTop: 60, gap: spacing[2] },
  titleText: { color: colors.text[50], fontSize: 22, fontWeight: '800', lineHeight: 28 },

  pillRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  ratingPill:  { borderWidth: 1, borderRadius: radius.xs, paddingHorizontal: 6, paddingVertical: 1 },
  ratingPillText: { fontSize: 11, fontWeight: '700' },
  yearText:    { color: colors.text[400], fontSize: 13 },

  svcBadge: {
    alignSelf: 'flex-start', paddingHorizontal: spacing[3], paddingVertical: spacing[1],
    borderRadius: radius.sm, marginTop: spacing[1],
  },
  svcBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  genreRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2],
    paddingHorizontal: spacing[4], marginBottom: spacing[3],
  },
  genrePill: {
    backgroundColor: colors.bg[800], borderRadius: radius.full,
    paddingHorizontal: spacing[3], paddingVertical: spacing[1],
  },
  genrePillText: { color: colors.text[300], fontSize: 12 },

  description: {
    color: colors.text[300], fontSize: 15, lineHeight: 22,
    paddingHorizontal: spacing[4], marginBottom: spacing[5],
  },

  actions: { paddingHorizontal: spacing[4], gap: spacing[3] },
  primaryBtn: {
    borderRadius: radius.lg, paddingVertical: spacing[4],
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  secondaryRow: { flexDirection: 'row', gap: spacing[3] },
  secondaryBtn: {
    flex: 1, borderRadius: radius.md, paddingVertical: spacing[3],
    backgroundColor: colors.bg[800], alignItems: 'center',
  },
  secondaryBtnActive: { backgroundColor: colors.brand.purple + '44' },
  dangerBtn:          { backgroundColor: colors.bg[700] },
  secondaryBtnText:   { color: colors.text[200], fontSize: 13, fontWeight: '600' },

  errorText: { color: colors.text[400], fontSize: 16, marginBottom: spacing[4] },
  backLink:  { color: colors.brand.purple, fontSize: 15 },
});
