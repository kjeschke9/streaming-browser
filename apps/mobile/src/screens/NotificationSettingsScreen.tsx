/**
 * Notification Settings Screen
 * apps/mobile/src/screens/NotificationSettingsScreen.tsx
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { colors, spacing, typographyPresets, radius } from '@streaming/tokens';
import { scheduleLocalNotification, cancelAllNotifications } from '../services/notificationService';

interface Prefs {
  newTitles: boolean;
  syncAlerts: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: Prefs = {
  newTitles: true,
  syncAlerts: false,
  weeklyDigest: true,
};

export default function NotificationSettingsScreen() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const toggle = (key: keyof Prefs) => {
    setPrefs(p => ({ ...p, [key]: !p[key] }));
  };

  const save = async () => {
    setSaving(true);
    await cancelAllNotifications();
    if (prefs.weeklyDigest) {
      await scheduleLocalNotification(
        'StreamHub Weekly',
        'New titles have arrived on your services. Tap to browse.',
        60 * 60 * 24 * 7, // 7 days
      );
    }
    setSaving(false);
    showToast('Preferences saved ✓');
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.inner}>
      <Text style={s.heading}>Notifications</Text>
      <Text style={s.sub}>
        Control which alerts StreamHub sends to your device.
      </Text>

      {([
        { key: 'newTitles',    label: 'New Titles',     desc: 'Alert when fresh content is added to your enabled services' },
        { key: 'syncAlerts',   label: 'Sync Alerts',    desc: 'Notify if a sync job fails or takes unusually long' },
        { key: 'weeklyDigest', label: 'Weekly Digest',  desc: 'A weekly summary of what\'s new across your services' },
      ] as const).map(({ key, label, desc }) => (
        <View key={key} style={s.row}>
          <View style={s.rowText}>
            <Text style={s.rowLabel}>{label}</Text>
            <Text style={s.rowDesc}>{desc}</Text>
          </View>
          <Switch
            value={prefs[key]}
            onValueChange={() => toggle(key)}
            trackColor={{ false: colors.bg[700], true: colors.accent[500] }}
            thumbColor={prefs[key] ? colors.accent[300] : colors.text[500]}
          />
        </View>
      ))}

      <TouchableOpacity style={s.saveBtn} onPress={save} disabled={saving}>
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.saveBtnText}>Save Preferences</Text>
        }
      </TouchableOpacity>

      {toast ? <Text style={s.toast}>{toast}</Text> : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg[950] },
  inner:     { padding: spacing[6], gap: spacing[4] },
  heading:   { ...typographyPresets.heading, color: colors.text[50], marginBottom: spacing[1] },
  sub:       { color: colors.text[400], fontSize: 14, marginBottom: spacing[6] },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.bg[800],
    borderRadius: radius.lg, padding: spacing[4],
    marginBottom: spacing[3],
  },
  rowText:  { flex: 1, marginRight: spacing[4] },
  rowLabel: { color: colors.text[100], fontSize: 16, fontWeight: '600' },
  rowDesc:  { color: colors.text[400], fontSize: 13, marginTop: 2 },
  saveBtn: {
    backgroundColor: colors.accent[600], borderRadius: radius.lg,
    padding: spacing[4], alignItems: 'center', marginTop: spacing[4],
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  toast: {
    textAlign: 'center', color: colors.accent[300],
    marginTop: spacing[4], fontSize: 14,
  },
});
