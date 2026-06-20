/**
 * SettingsHomeScreen — top-level settings menu (v3).
 *
 * Updated:
 *   + Watchlist row
 *   + About StreamHub row (links to AboutScreen with TMDB attribution)
 */

import React, { useCallback } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector }              from 'react-redux';
import { useNavigation }                         from '@react-navigation/native';
import type { NativeStackNavigationProp }        from '@react-navigation/native-stack';
import type { RootState, AppDispatch }           from '../store';
import { logout, completeOnboarding }            from '../store/slices/authSlice';
import { colors, spacing, radius }               from '@streaming/tokens';
import type { SettingsStackParamList }           from '../navigation/types';

type Nav = NativeStackNavigationProp<SettingsStackParamList>;

interface SettingsRow {
  icon:    string;
  label:   string;
  sub?:    string;
  onPress: () => void;
  danger?: boolean;
}

export default function SettingsHomeScreen() {
  const dispatch   = useDispatch<AppDispatch>();
  const navigation = useNavigation<Nav>();
  const { user }   = useSelector((s: RootState) => s.auth);
  const { profile } = useSelector((s: RootState) => s.exclusion);
  const { totals } = useSelector((s: RootState) => s.sync);

  const safeFeedMode = profile?.safeFeed?.mode ?? 'off';

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out', style: 'destructive',
          onPress: () => dispatch(logout()),
        },
      ]
    );
  }, [dispatch]);

  const rows: SettingsRow[] = [
    {
      icon:    '🛡️',
      label:   'Safe-Feed',
      sub:     `Mode: ${safeFeedMode === 'off' ? 'Off' : safeFeedMode === 'kids' ? 'Kids' : 'Custom'}`,
      onPress: () => navigation.navigate('SafeFeedSettings'),
    },
    {
      icon:    '🙈',
      label:   'Hidden Content',
      sub:     'Manage hidden titles and tag rules',
      onPress: () => navigation.navigate('HiddenContentManager'),
    },
    {
      icon:    '🔖',
      label:   'My Watchlist',
      sub:     'Saved titles',
      onPress: () => (navigation as any).navigate('Watchlist'),
    },
    {
      icon:    '📡',
      label:   'Sync Status',
      sub:     totals
        ? `${totals.titles.toLocaleString()} titles in catalogue`
        : 'Catalogue health dashboard',
      onPress: () => navigation.navigate('SyncStatus'),
    },
    {
      icon:    'ℹ️',
      label:   'About StreamHub',
      sub:     'Credits, TMDB attribution, open source',
      onPress: () => navigation.navigate('About'),
    },
    {
      icon:    '🚪',
      label:   'Sign Out',
      danger:  true,
      onPress: handleLogout,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Account card */}
      <View style={styles.accountCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.username ?? user?.email ?? '?')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.accountInfo}>
          <Text style={styles.accountName}>{user?.username ?? 'StreamHub User'}</Text>
          <Text style={styles.accountEmail}>{user?.email ?? ''}</Text>
        </View>
      </View>

      {/* Settings rows */}
      <View style={styles.section}>
        {rows.map((row, i) => (
          <TouchableOpacity
            key={row.label}
            style={[
              styles.row,
              i === 0 && styles.rowFirst,
              i === rows.length - 1 && styles.rowLast,
            ]}
            onPress={row.onPress}
          >
            <Text style={styles.rowIcon}>{row.icon}</Text>
            <View style={styles.rowInfo}>
              <Text style={[styles.rowLabel, row.danger && styles.dangerText]}>
                {row.label}
              </Text>
              {row.sub && <Text style={styles.rowSub}>{row.sub}</Text>}
            </View>
            {!row.danger && <Text style={styles.rowArrow}>›</Text>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing[8] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },

  accountCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[4],
    backgroundColor: colors.bg[800], margin: spacing[4], borderRadius: radius.xl,
    padding: spacing[5],
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.brand.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  accountInfo:   { flex: 1 },
  accountName:   { color: colors.text[50], fontSize: 17, fontWeight: '700' },
  accountEmail:  { color: colors.text[400], fontSize: 13, marginTop: 2 },

  section: {
    marginHorizontal: spacing[4],
    backgroundColor:  colors.bg[800],
    borderRadius:     radius.xl,
    overflow:         'hidden',
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    padding:        spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bg[700],
    gap:            spacing[3],
  },
  rowFirst: { borderTopWidth: 0 },
  rowLast:  {},

  rowIcon:  { fontSize: 22, width: 32, textAlign: 'center' },
  rowInfo:  { flex: 1 },
  rowLabel: { color: colors.text[100], fontSize: 15, fontWeight: '600' },
  rowSub:   { color: colors.text[400], fontSize: 12, marginTop: 2 },
  rowArrow: { color: colors.text[500], fontSize: 22 },
  dangerText:{ color: '#ef4444' },
});
