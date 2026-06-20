/**
 * SettingsHomeScreen — account card + nav rows for all settings sections.
 * Shows Safe-Feed mode badge, sync stats, and sign-out.
 */

import React, { useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector }    from 'react-redux';
import { useNavigation }               from '@react-navigation/native';
import type { RootState, AppDispatch } from '../../store';
import { logout }                      from '../../store/slices/authSlice';
import { fetchSyncStatus }             from '../../store/slices/syncSlice';
import { colors, spacing, radius }     from '@streaming/tokens';

const SAFE_FEED_LABELS: Record<string, string> = {
  off:    'Off',
  on:     'On',
  locked: '🔒 Locked',
};

const SAFE_FEED_COLORS: Record<string, string> = {
  off:    colors.text[400],
  on:     colors.safeFeed.green,
  locked: colors.safeFeed.amber,
};

export default function SettingsHomeScreen() {
  const dispatch   = useDispatch<AppDispatch>();
  const navigation = useNavigation<any>();
  const { user }   = useSelector((s: RootState) => s.auth);
  const profile    = useSelector((s: RootState) => s.exclusion.profile);
  const { totals } = useSelector((s: RootState) => s.sync);

  useEffect(() => { dispatch(fetchSyncStatus()); }, [dispatch]);

  const safeFeedMode = profile?.safeFeed?.mode ?? 'off';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: () => dispatch(logout()),
      },
    ]);
  };

  const Row = ({
    icon, label, subtitle, onPress, chevron = true,
    badge, badgeColor,
  }: {
    icon: string; label: string; subtitle?: string; onPress?: () => void;
    chevron?: boolean; badge?: string; badgeColor?: string;
  }) => (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, { backgroundColor: (badgeColor ?? colors.text[500]) + '22' }]}>
          <Text style={[styles.badgeText, { color: badgeColor ?? colors.text[400] }]}>{badge}</Text>
        </View>
      )}
      {chevron && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>

      {/* ── Account Card ── */}
      <View style={styles.accountCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarLetter}>
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{user?.name ?? 'Unknown'}</Text>
          <Text style={styles.accountEmail}>{user?.email ?? ''}</Text>
        </View>
      </View>

      {/* ── Catalogue Stats ── */}
      {totals && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totals.titles.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Titles</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{totals.services}</Text>
            <Text style={styles.statLabel}>Services</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>
              {profile?.hiddenTitles?.length ?? 0}
            </Text>
            <Text style={styles.statLabel}>Hidden</Text>
          </View>
        </View>
      )}

      {/* ── Safe-Feed ── */}
      <Text style={styles.section}>Parental Controls</Text>
      <View style={styles.card}>
        <Row
          icon="🛡️"
          label="Safe-Feed"
          subtitle="Rating filters and content gate"
          onPress={() => navigation.navigate('SafeFeedSettings')}
          badge={SAFE_FEED_LABELS[safeFeedMode] ?? safeFeedMode}
          badgeColor={SAFE_FEED_COLORS[safeFeedMode]}
        />
        <View style={styles.divider} />
        <Row
          icon="🔐"
          label="Safe-Feed PIN"
          subtitle="Protect settings with a PIN"
          onPress={() => navigation.navigate('SafeFeedPin', { mode: 'manage' })}
        />
        <View style={styles.divider} />
        <Row
          icon="🚫"
          label="Hidden Content"
          subtitle={`${profile?.hiddenTitles?.length ?? 0} titles · ${profile?.globalTagRules?.length ?? 0} tag rules`}
          onPress={() => navigation.navigate('HiddenContentManager')}
        />
      </View>

      {/* ── Account ── */}
      <Text style={styles.section}>Account</Text>
      <View style={styles.card}>
        <Row
          icon="📺"
          label="Services"
          subtitle="Manage streaming subscriptions"
          onPress={() => navigation.navigate('Services')}
        />
        <View style={styles.divider} />
        <Row
          icon="🔄"
          label="Sync Status"
          subtitle="Catalogue health and update times"
          onPress={() => navigation.navigate('SyncStatus')}
        />
      </View>

      {/* ── Sign Out ── */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: spacing[10] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },

  accountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[900], padding: spacing[5],
    marginBottom: spacing[1],
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.brand.purple,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing[4],
  },
  avatarLetter: { color: '#fff', fontSize: 24, fontWeight: '700' },
  accountInfo:  { flex: 1 },
  accountName:  { color: colors.text[50], fontSize: 18, fontWeight: '700' },
  accountEmail: { color: colors.text[400], fontSize: 13, marginTop: 2 },

  statsRow: {
    flexDirection: 'row', backgroundColor: colors.bg[800],
    paddingVertical: spacing[4], marginBottom: spacing[2],
  },
  stat:        { flex: 1, alignItems: 'center' },
  statValue:   { color: colors.text[50], fontSize: 22, fontWeight: '800' },
  statLabel:   { color: colors.text[400], fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: colors.border.default },

  section: {
    color: colors.text[400], fontSize: 12, fontWeight: '600',
    letterSpacing: 1, textTransform: 'uppercase',
    paddingHorizontal: spacing[5], paddingTop: spacing[5], paddingBottom: spacing[2],
  },

  card: {
    backgroundColor: colors.bg[900],
    marginHorizontal: spacing[4], borderRadius: radius.lg,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.border.default, marginLeft: spacing[14] },

  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4],
  },
  rowIcon:    { fontSize: 22, marginRight: spacing[3] },
  rowContent: { flex: 1 },
  rowLabel:   { color: colors.text[100], fontSize: 15, fontWeight: '600' },
  rowSub:     { color: colors.text[400], fontSize: 12, marginTop: 1 },
  chevron:    { color: colors.text[500], fontSize: 22 },
  badge: {
    paddingHorizontal: spacing[2], paddingVertical: 2,
    borderRadius: radius.sm, marginRight: spacing[2],
  },
  badgeText: { fontSize: 12, fontWeight: '600' },

  signOutBtn: {
    margin: spacing[5], borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.safeFeed.red + '66',
    paddingVertical: spacing[4], alignItems: 'center',
  },
  signOutText: { color: colors.safeFeed.red, fontWeight: '700', fontSize: 16 },
});
