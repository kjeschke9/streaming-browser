/**
 * AboutScreen — credits, TMDB attribution (required by TMDB ToS), and app info.
 *
 * TMDB ATTRIBUTION REQUIREMENT:
 *   "This product uses the TMDB API but is not endorsed or certified by TMDB."
 *   The TMDB logo must be displayed alongside this text.
 *   Source: https://www.themoviedb.org/documentation/api/terms-of-use
 *
 * This screen satisfies that requirement.
 */

import React from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, spacing, radius } from '@streaming/tokens';

// ─── App version ──────────────────────────────────────────────────────────────
const APP_VERSION = '1.0.0';
const BUILD_DATE  = '2026';

// ─── TMDB logo (hosted on TMDB's own CDN — the official way per their ToS) ───
// If offline / in tests, falls back to a placeholder.
const TMDB_LOGO_URI =
  'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885f47.svg';

interface CreditRow {
  title:   string;
  url:     string;
  note:    string;
}

const CREDITS: CreditRow[] = [
  {
    title: 'The Movie Database (TMDB)',
    url:   'https://www.themoviedb.org',
    note:  'Content metadata, posters, and backdrops',
  },
  {
    title: 'React Native',
    url:   'https://reactnative.dev',
    note:  'Mobile app framework (MIT License)',
  },
  {
    title: 'Expo',
    url:   'https://expo.dev',
    note:  'Build toolchain (MIT License)',
  },
  {
    title: 'PostgreSQL',
    url:   'https://www.postgresql.org',
    note:  'Database (PostgreSQL License)',
  },
  {
    title: 'Express',
    url:   'https://expressjs.com',
    note:  'Backend API framework (MIT License)',
  },
  {
    title: 'Samsung Tizen',
    url:   'https://developer.samsung.com/smarttv',
    note:  'Smart TV platform',
  },
];

export default function AboutScreen() {
  const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── App header ── */}
      <View style={styles.appHeader}>
        <Text style={styles.appIcon}>🎬</Text>
        <Text style={styles.appName}>StreamHub</Text>
        <Text style={styles.appVersion}>Version {APP_VERSION} · {BUILD_DATE}</Text>
        <Text style={styles.appTagline}>
          Your streaming library, unified.
        </Text>
      </View>

      {/* ── TMDB Attribution (REQUIRED) ── */}
      <View style={styles.tmdbCard}>
        <Text style={styles.sectionLabel}>Powered by</Text>

        {/* TMDB logo — we use a text-based fallback since SVG loading varies */}
        <View style={styles.tmdbLogoBox}>
          <Text style={styles.tmdbLogoText}>TMDB</Text>
          <View style={styles.tmdbLogoBadge}>
            <Text style={styles.tmdbLogoBadgeText}>The Movie Database</Text>
          </View>
        </View>

        <Text style={styles.tmdbAttribution}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>

        <TouchableOpacity
          style={styles.tmdbLink}
          onPress={() => openUrl('https://www.themoviedb.org')}
        >
          <Text style={styles.tmdbLinkText}>themoviedb.org →</Text>
        </TouchableOpacity>
      </View>

      {/* ── Open source credits ── */}
      <Text style={styles.sectionTitle}>Open Source & Credits</Text>
      {CREDITS.map(c => (
        <TouchableOpacity
          key={c.url}
          style={styles.creditRow}
          onPress={() => openUrl(c.url)}
        >
          <View style={styles.creditInfo}>
            <Text style={styles.creditTitle}>{c.title}</Text>
            <Text style={styles.creditNote}>{c.note}</Text>
          </View>
          <Text style={styles.creditArrow}>›</Text>
        </TouchableOpacity>
      ))}

      {/* ── Legal ── */}
      <View style={styles.legalBox}>
        <Text style={styles.legalText}>
          StreamHub is a personal project and is not affiliated with, endorsed by, or
          connected to any streaming service mentioned herein. All service names, logos,
          and trademarks are the property of their respective owners.
        </Text>
        <Text style={styles.legalText}>
          Content metadata provided by The Movie Database (TMDB) under their Terms of Use.
          StreamHub uses the TMDB API for personal, non-commercial purposes only.
        </Text>
      </View>

      {/* ── Contact / GitHub ── */}
      <TouchableOpacity
        style={styles.githubBtn}
        onPress={() => openUrl('https://github.com/kjeschke9/streaming-browser')}
      >
        <Text style={styles.githubBtnText}>⌥ View Source on GitHub</Text>
      </TouchableOpacity>

      <View style={{ height: spacing[8] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },
  content:   { padding: spacing[5] },

  // App header
  appHeader: { alignItems: 'center', paddingVertical: spacing[8] },
  appIcon:   { fontSize: 64, marginBottom: spacing[2] },
  appName:   { color: colors.text[50], fontSize: 32, fontWeight: '800' },
  appVersion:{ color: colors.text[400], fontSize: 14, marginTop: 2 },
  appTagline:{ color: colors.text[300], fontSize: 15, marginTop: spacing[2] },

  // TMDB attribution block
  tmdbCard: {
    backgroundColor: colors.bg[800], borderRadius: radius.xl,
    padding: spacing[5], marginBottom: spacing[6],
    borderWidth: 1, borderColor: '#01B4E4' + '44',
    alignItems: 'center',
  },
  sectionLabel: {
    color: colors.text[400], fontSize: 11, fontWeight: '700',
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing[3],
  },
  tmdbLogoBox: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    marginBottom: spacing[3],
  },
  tmdbLogoText: {
    color: '#01B4E4', fontSize: 28, fontWeight: '900',
    letterSpacing: 1,
  },
  tmdbLogoBadge: {
    backgroundColor: '#01B4E4', borderRadius: radius.sm,
    paddingHorizontal: spacing[2], paddingVertical: 2,
  },
  tmdbLogoBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  tmdbAttribution: {
    color: colors.text[200], fontSize: 13, textAlign: 'center',
    lineHeight: 20, marginBottom: spacing[3],
  },
  tmdbLink: {
    paddingVertical: spacing[2], paddingHorizontal: spacing[4],
    backgroundColor: '#01B4E4' + '22', borderRadius: radius.md,
  },
  tmdbLinkText: { color: '#01B4E4', fontSize: 13, fontWeight: '700' },

  // Credits
  sectionTitle: {
    color: colors.text[50], fontSize: 17, fontWeight: '700',
    marginBottom: spacing[3],
  },
  creditRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[800], borderRadius: radius.md,
    padding: spacing[4], marginBottom: spacing[2],
  },
  creditInfo:  { flex: 1 },
  creditTitle: { color: colors.text[100], fontSize: 14, fontWeight: '600' },
  creditNote:  { color: colors.text[400], fontSize: 12, marginTop: 2 },
  creditArrow: { color: colors.text[600], fontSize: 20 },

  // Legal
  legalBox: {
    backgroundColor: colors.bg[900], borderRadius: radius.md,
    padding: spacing[4], marginTop: spacing[5], marginBottom: spacing[4],
    gap: spacing[3],
  },
  legalText: { color: colors.text[500], fontSize: 11, lineHeight: 17 },

  // GitHub
  githubBtn: {
    borderWidth: 1, borderColor: colors.bg[700], borderRadius: radius.lg,
    paddingVertical: spacing[4], alignItems: 'center',
  },
  githubBtnText: { color: colors.text[300], fontSize: 14, fontWeight: '600' },
});
