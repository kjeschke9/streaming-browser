/**
 * OnboardingScreen — first-run experience (3 steps):
 *
 *  Step 1 — Welcome          : StreamHub branding, brief pitch
 *  Step 2 — Pick Services    : toggle which streaming services you have
 *  Step 3 — Safe-Feed Setup  : choose a mode (off / kids / custom) and set PIN
 *
 * On completion → saves service selections + safe-feed mode, navigates to Main.
 *
 * This screen is shown when:
 *   - The user just registered (AppNavigator detects `isOnboarding` flag in auth slice)
 *   - Or can be re-entered from Settings → "Redo Setup"
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch }                           from 'react-redux';
import type { AppDispatch }                      from '../store';
import { getApiClient }                          from '../store/apiClient';
import { fetchServices }                         from '../store/slices/servicesSlice';
import { colors, spacing, radius, typographyPresets } from '@streaming/tokens';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Service definitions ──────────────────────────────────────────────────────

interface SvcOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

const ALL_SERVICES: SvcOption[] = [
  { id: 'netflix',     label: 'Netflix',       emoji: '🔴', color: '#E50914' },
  { id: 'prime',       label: 'Prime Video',   emoji: '🔵', color: '#00A8E1' },
  { id: 'hulu',        label: 'Hulu',          emoji: '🟢', color: '#1CE783' },
  { id: 'disney',      label: 'Disney+',       emoji: '🏰', color: '#113CCF' },
  { id: 'hbo',         label: 'Max',           emoji: '👑', color: '#5822E0' },
  { id: 'apple',       label: 'Apple TV+',     emoji: '🍎', color: '#555555' },
  { id: 'peacock',     label: 'Peacock',       emoji: '🦚', color: '#E08700' },
  { id: 'paramount',   label: 'Paramount+',    emoji: '⭐', color: '#0064FF' },
  { id: 'crunchyroll', label: 'Crunchyroll',   emoji: '🎌', color: '#F47521' },
];

// ─── Safe-Feed modes ──────────────────────────────────────────────────────────

interface ModeOption {
  id: 'off' | 'kids' | 'custom';
  label: string;
  description: string;
  emoji: string;
  ratings: string[];
}

const SAFE_FEED_MODES: ModeOption[] = [
  {
    id:          'off',
    label:       'No Filter',
    description: 'All content visible to everyone.',
    emoji:       '🔓',
    ratings:     [],
  },
  {
    id:          'kids',
    label:       'Kids Mode',
    description: 'Only G, TV-G, TV-Y, and TV-Y7 titles shown.',
    emoji:       '👶',
    ratings:     ['G', 'TV-G', 'TV-Y', 'TV-Y7'],
  },
  {
    id:          'custom',
    label:       'Custom',
    description: 'You choose allowed ratings and blocked tags.',
    emoji:       '⚙️',
    ratings:     ['G', 'TV-G', 'TV-Y', 'TV-Y7', 'PG', 'TV-PG'],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const dispatch = useDispatch<AppDispatch>();

  const [step, setStep]                   = useState(0);         // 0,1,2
  const [selectedSvcs, setSelectedSvcs]  = useState<Set<string>>(
    new Set(['netflix', 'prime', 'hulu', 'disney'])  // sensible defaults
  );
  const [selectedMode, setSelectedMode]  = useState<'off' | 'kids' | 'custom'>('off');
  const [saving, setSaving]              = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  const goToStep = useCallback((next: number) => {
    Animated.timing(slideAnim, {
      toValue:        -SCREEN_W * next,
      duration:       300,
      useNativeDriver: true,
    }).start();
    setStep(next);
  }, [slideAnim]);

  const toggleService = useCallback((id: string) => {
    setSelectedSvcs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // ── Finish & save ─────────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    if (selectedSvcs.size === 0) {
      Alert.alert('Select at least one service', 'You need at least one streaming service enabled.');
      return;
    }

    setSaving(true);
    try {
      const api = getApiClient();

      // 1. Enable/disable each service
      await Promise.all(
        ALL_SERVICES.map(svc =>
          api.patch(`/api/services/${svc.id}/toggle`, {
            enabled: selectedSvcs.has(svc.id),
          }).catch(() => {/* non-fatal */})
        )
      );

      // 2. Set Safe-Feed config
      const mode = SAFE_FEED_MODES.find(m => m.id === selectedMode)!;
      await api.put('/api/exclusion/safe-feed', {
        mode:           selectedMode,
        allowedRatings: mode.ratings,
        blockedTagPatterns: [],
        showBadge:      true,
      }).catch(() => {/* non-fatal */});

      // 3. Refresh services in Redux
      await dispatch(fetchServices());

      onComplete();
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Setup failed. You can adjust this later in Settings.');
      onComplete();  // let them through anyway
    } finally {
      setSaving(false);
    }
  }, [selectedSvcs, selectedMode, dispatch, onComplete]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      {/* Slides */}
      <Animated.View
        style={[styles.slides, { transform: [{ translateX: slideAnim }] }]}
      >
        {/* ── Step 0: Welcome ── */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.bigEmoji}>🎬</Text>
          <Text style={styles.welcomeTitle}>Welcome to StreamHub</Text>
          <Text style={styles.welcomeSub}>
            One place to browse all your streaming services — with smart filtering, parental controls,
            and a unified search.
          </Text>
          <View style={styles.featureList}>
            {[
              ['🔍', 'Search across Netflix, Prime, Hulu, Disney+ and more'],
              ['🛡️', 'Safe-Feed keeps kids content separate'],
              ['🙈', 'Long-press to hide any title you don\'t want to see'],
              ['📺', 'Samsung TV support via the Tizen app'],
            ].map(([emoji, text]) => (
              <View key={text} style={styles.featureRow}>
                <Text style={styles.featureEmoji}>{emoji}</Text>
                <Text style={styles.featureText}>{text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => goToStep(1)}>
            <Text style={styles.primaryBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </View>

        {/* ── Step 1: Services ── */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.slideTitle}>Which services do you subscribe to?</Text>
          <Text style={styles.slideSub}>You can change this any time in Settings.</Text>

          <View style={styles.svcGrid}>
            {ALL_SERVICES.map(svc => {
              const active = selectedSvcs.has(svc.id);
              return (
                <TouchableOpacity
                  key={svc.id}
                  style={[
                    styles.svcCard,
                    active && { borderColor: svc.color, backgroundColor: svc.color + '22' },
                  ]}
                  onPress={() => toggleService(svc.id)}
                >
                  <Text style={styles.svcEmoji}>{svc.emoji}</Text>
                  <Text style={[styles.svcLabel, active && { color: svc.color }]} numberOfLines={1}>
                    {svc.label}
                  </Text>
                  {active && <Text style={[styles.svcCheck, { color: svc.color }]}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => goToStep(0)}>
              <Text style={styles.ghostBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={() => goToStep(2)}
              disabled={selectedSvcs.size === 0}
            >
              <Text style={styles.primaryBtnText}>
                Next ({selectedSvcs.size} selected) →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Step 2: Safe-Feed ── */}
        <View style={[styles.slide, { width: SCREEN_W }]}>
          <Text style={styles.slideTitle}>Content Filtering</Text>
          <Text style={styles.slideSub}>
            Safe-Feed hides age-restricted titles. You can lock it with a PIN after setup.
          </Text>

          {SAFE_FEED_MODES.map(mode => (
            <TouchableOpacity
              key={mode.id}
              style={[
                styles.modeCard,
                selectedMode === mode.id && styles.modeCardActive,
              ]}
              onPress={() => setSelectedMode(mode.id)}
            >
              <Text style={styles.modeEmoji}>{mode.emoji}</Text>
              <View style={styles.modeInfo}>
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeDesc}>{mode.description}</Text>
                {mode.ratings.length > 0 && (
                  <Text style={styles.modeRatings}>
                    Allows: {mode.ratings.join(' · ')}
                  </Text>
                )}
              </View>
              {selectedMode === mode.id && (
                <Text style={styles.modeCheck}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

          <Text style={styles.pinNote}>
            💡 You can set a PIN to lock Safe-Feed settings in Settings → Safe-Feed after setup.
          </Text>

          <View style={styles.navRow}>
            <TouchableOpacity style={styles.ghostBtn} onPress={() => goToStep(1)}>
              <Text style={styles.ghostBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={handleFinish}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Finish Setup ✓</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bg[950] },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingTop: spacing[4] },
  dot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.bg[700] },
  dotActive: { backgroundColor: colors.brand.purple, width: 24 },

  slides: { flexDirection: 'row', flex: 1 },
  slide:  {
    flex: 1, paddingHorizontal: spacing[6], paddingTop: spacing[6],
    alignItems: 'center',
  },

  // Welcome slide
  bigEmoji:     { fontSize: 72, marginBottom: spacing[4] },
  welcomeTitle: { color: colors.text[50], fontSize: 32, fontWeight: '800', textAlign: 'center', marginBottom: spacing[3] },
  welcomeSub:   { color: colors.text[300], fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: spacing[6] },

  featureList: { width: '100%', gap: spacing[3], marginBottom: spacing[8] },
  featureRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] },
  featureEmoji:{ fontSize: 20, width: 28 },
  featureText: { color: colors.text[200], fontSize: 14, flex: 1, lineHeight: 20 },

  // Services slide
  slideTitle: { color: colors.text[50], fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: spacing[2] },
  slideSub:   { color: colors.text[400], fontSize: 14, textAlign: 'center', marginBottom: spacing[5] },

  svcGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3],
    justifyContent: 'center', width: '100%', marginBottom: spacing[6],
  },
  svcCard: {
    width: 90, height: 80, borderRadius: radius.lg,
    backgroundColor: colors.bg[800], borderWidth: 2, borderColor: colors.bg[700],
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    padding: spacing[2],
  },
  svcEmoji: { fontSize: 24, marginBottom: 4 },
  svcLabel: { color: colors.text[300], fontSize: 11, fontWeight: '600', textAlign: 'center' },
  svcCheck: { position: 'absolute', top: 4, right: 6, fontSize: 14, fontWeight: '800' },

  // Safe-Feed slide
  modeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[800], borderRadius: radius.lg,
    borderWidth: 2, borderColor: colors.bg[700],
    padding: spacing[4], width: '100%', marginBottom: spacing[3],
    gap: spacing[3],
  },
  modeCardActive: { borderColor: colors.brand.purple, backgroundColor: colors.brand.purple + '18' },
  modeEmoji: { fontSize: 28, width: 36 },
  modeInfo:  { flex: 1 },
  modeLabel: { color: colors.text[50], fontSize: 16, fontWeight: '700' },
  modeDesc:  { color: colors.text[300], fontSize: 13, marginTop: 2 },
  modeRatings: { color: colors.text[400], fontSize: 11, marginTop: 4 },
  modeCheck: { color: colors.brand.purple, fontSize: 20, fontWeight: '800' },

  pinNote: {
    color: colors.text[400], fontSize: 12, textAlign: 'center',
    marginTop: spacing[2], marginBottom: spacing[6], lineHeight: 18,
  },

  // Shared
  navRow:    { flexDirection: 'row', gap: spacing[3], width: '100%' },
  primaryBtn: {
    backgroundColor: colors.brand.purple, borderRadius: radius.lg,
    paddingVertical: spacing[4], alignItems: 'center',
    paddingHorizontal: spacing[5],
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: {
    borderRadius: radius.lg, paddingVertical: spacing[4],
    paddingHorizontal: spacing[4], borderWidth: 1, borderColor: colors.bg[700],
    alignItems: 'center',
  },
  ghostBtnText: { color: colors.text[300], fontSize: 15 },
});
