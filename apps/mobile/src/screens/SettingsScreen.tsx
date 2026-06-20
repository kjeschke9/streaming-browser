import React, { useState } from 'react';
import {
  View, Text, ScrollView, Switch, StyleSheet,
  TouchableOpacity, Alert, TextInput as RNTextInput,
} from 'react-native';
import { Theme } from '../components/BurgundhyTheme';
import { TagPill } from '../components/TagPill';
import { Button } from '../components/Button';
import { useExclusionStore, useAuthStore } from '../store';
import { useSafeFeed } from '../hooks/useSafeFeed';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '@streambrws/shared-logic';
import type { ServiceId } from '@streambrws/shared-types';

const ALL_SERVICES: { id: ServiceId; label: string; color: string }[] = [
  { id: 'netflix',        label: 'Netflix',        color: '#E50914' },
  { id: 'hulu',           label: 'Hulu',           color: '#1CE783' },
  { id: 'hbo_max',        label: 'HBO Max',        color: '#A020F0' },
  { id: 'disney_plus',    label: 'Disney+',        color: '#113CCF' },
  { id: 'amazon_prime',   label: 'Prime Video',    color: '#00A8E1' },
  { id: 'apple_tv',       label: 'Apple TV+',      color: '#888888' },
  { id: 'paramount_plus', label: 'Paramount+',     color: '#0064FF' },
  { id: 'peacock',        label: 'Peacock',        color: '#FF6600' },
  { id: 'showtime',       label: 'Showtime',       color: '#CC0000' },
  { id: 'starz',          label: 'Starz',          color: '#000099' },
];

const SUGGESTED_TAGS = [
  'horror', 'violence', 'political', 'adult', 'anime',
  'reality-tv', 'crime', 'war', 'documentary', 'comedy',
];

export function SettingsScreen() {
  const [newTag, setNewTag]   = useState('');
  const exclusions            = useExclusionStore();
  const { enabled, hasPinSet, isUnlocked, verifyPin, setPin, toggleSafeFeed } = useSafeFeed();
  const { logout }            = useAuth();
  const { user }              = useAuthStore();
  const [pinInput, setPinInput]  = useState('');
  const [newPin, setNewPin]      = useState('');
  const [pinMode, setPinMode]    = useState<'verify' | 'set' | null>(null);
  const [pinError, setPinError]  = useState<string | null>(null);

  const addTag = async () => {
    const tag = newTag.trim().toLowerCase();
    if (!tag || exclusions.tags.includes(tag)) { setNewTag(''); return; }
    exclusions.addTag(tag);
    await profileApi.addExclusionTag(tag);
    setNewTag('');
  };

  const removeTag = async (tag: string) => {
    exclusions.removeTag(tag);
    // Server removal handled via sync
  };

  const handlePinSubmit = async () => {
    setPinError(null);
    if (pinMode === 'verify') {
      const ok = await verifyPin(pinInput);
      if (!ok) { setPinError('Incorrect PIN'); return; }
      setPinMode(null); setPinInput('');
    } else if (pinMode === 'set') {
      if (newPin.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
      await setPin(newPin);
      setPinMode(null); setNewPin(''); setPinInput('');
      Alert.alert('Success', 'PIN set successfully');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ─── Profile ─────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACCOUNT</Text>
        <View style={styles.card}>
          <Text style={styles.userName}>{user?.displayName ?? 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <Button label="Sign Out" variant="ghost" onPress={logout} style={{ marginTop: Theme.spacing.md }} />
        </View>
      </View>

      {/* ─── Service Toggles ──────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STREAMING SERVICES</Text>
        <View style={styles.card}>
          {ALL_SERVICES.map(svc => (
            <View key={svc.id} style={styles.row}>
              <View style={[styles.dot, { backgroundColor: svc.color }]} />
              <Text style={styles.rowLabel}>{svc.label}</Text>
              <Switch
                value={exclusions.serviceToggles[svc.id] !== false}
                onValueChange={(v) => exclusions.toggleService(svc.id, v)}
                trackColor={{ false: Theme.colors.gray700, true: Theme.colors.burgundy500 }}
                thumbColor={Theme.colors.white}
              />
            </View>
          ))}
        </View>
      </View>

      {/* ─── Exclusion Tags ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GLOBAL EXCLUSION TAGS</Text>
        <Text style={styles.sectionDesc}>
          Content tagged with these genres or keywords will be hidden everywhere.
        </Text>
        <View style={styles.card}>
          <View style={styles.tagRow}>
            {exclusions.tags.map(tag => (
              <TagPill key={tag} label={tag} onRemove={() => removeTag(tag)} active />
            ))}
          </View>
          {/* Add tag input */}
          <View style={styles.addTagRow}>
            <RNTextInput
              style={styles.tagInput}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag (e.g. horror)"
              placeholderTextColor={Theme.colors.gray500}
              onSubmitEditing={addTag}
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.addBtn} onPress={addTag}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {/* Suggestions */}
          <Text style={styles.suggestLabel}>Suggestions:</Text>
          <View style={styles.tagRow}>
            {SUGGESTED_TAGS.filter(t => !exclusions.tags.includes(t)).slice(0, 6).map(t => (
              <TagPill key={t} label={t} onRemove={() => { exclusions.addTag(t); profileApi.addExclusionTag(t); }} />
            ))}
          </View>
        </View>
      </View>

      {/* ─── Hidden Titles Search ─────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HIDDEN TITLES IN SEARCH</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Show hidden titles in search results</Text>
            <Switch
              value={exclusions.hiddenTitleSearchEnabled}
              onValueChange={(v) => exclusions.setHiddenSearch(v)}
              trackColor={{ false: Theme.colors.gray700, true: Theme.colors.burgundy500 }}
              thumbColor={Theme.colors.white}
            />
          </View>
          <Text style={styles.rowHint}>
            When enabled, hidden titles will appear (dimmed) in search. Useful for verifying what's hidden.
          </Text>
        </View>
      </View>

      {/* ─── Safe-Feed Mode ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SAFE-FEED MODE</Text>
        <Text style={styles.sectionDesc}>
          Restricts browsing to allowed services and content. Requires a PIN to disable.
        </Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Safe-Feed Enabled</Text>
            <Switch
              value={enabled}
              onValueChange={(v) => { if (!hasPinSet && v) { setPinMode('set'); } else { toggleSafeFeed(v); } }}
              trackColor={{ false: Theme.colors.gray700, true: Theme.colors.burgundy500 }}
              thumbColor={Theme.colors.white}
              disabled={!isUnlocked && enabled}
            />
          </View>
          {hasPinSet ? (
            <Button label={isUnlocked ? 'Change PIN' : 'Change PIN (unlock first)'} variant="secondary"
              onPress={() => { if (isUnlocked) setPinMode('set'); else setPinMode('verify'); }}
              style={{ marginTop: Theme.spacing.md }} />
          ) : (
            <Button label="Set PIN" variant="secondary" onPress={() => setPinMode('set')} style={{ marginTop: Theme.spacing.md }} />
          )}

          {pinMode && (
            <View style={styles.pinBox}>
              <Text style={styles.pinTitle}>{pinMode === 'set' ? 'Set new PIN' : 'Enter PIN to unlock'}</Text>
              {pinError && <Text style={styles.pinError}>{pinError}</Text>}
              <RNTextInput
                style={styles.pinInput}
                value={pinMode === 'set' ? newPin : pinInput}
                onChangeText={pinMode === 'set' ? setNewPin : setPinInput}
                keyboardType="numeric"
                secureTextEntry
                maxLength={8}
                placeholder="Enter PIN"
                placeholderTextColor={Theme.colors.gray500}
              />
              <View style={styles.pinBtns}>
                <Button label="Cancel" variant="ghost" onPress={() => { setPinMode(null); setPinError(null); }} style={{ flex: 1, marginRight: 8 }} />
                <Button label="Confirm" onPress={handlePinSubmit} style={{ flex: 1 }} />
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: Theme.bg.screen },
  content: { padding: Theme.spacing.md, paddingBottom: Theme.spacing.xxxl },
  section: { marginBottom: Theme.spacing.xl },
  sectionTitle: {
    fontSize: Theme.typography.xs, fontWeight: Theme.typography.weight.bold,
    color: Theme.text.muted, letterSpacing: 1.2, marginBottom: Theme.spacing.sm,
  },
  sectionDesc: { fontSize: Theme.typography.sm, color: Theme.text.muted, marginBottom: Theme.spacing.sm },
  card: {
    backgroundColor: Theme.bg.card, borderRadius: Theme.radius.lg,
    padding: Theme.spacing.md, borderWidth: 1, borderColor: Theme.border.default,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Theme.spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: Theme.spacing.sm },
  rowLabel: { flex: 1, color: Theme.text.primary, fontSize: Theme.typography.md },
  rowHint: { color: Theme.text.muted, fontSize: Theme.typography.xs, marginTop: 4, lineHeight: 16 },
  userName: { color: Theme.text.primary, fontSize: Theme.typography.lg, fontWeight: Theme.typography.weight.semiBold },
  userEmail: { color: Theme.text.muted, fontSize: Theme.typography.sm, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Theme.spacing.sm },
  addTagRow: { flexDirection: 'row', alignItems: 'center', gap: Theme.spacing.sm, marginBottom: Theme.spacing.md },
  tagInput: {
    flex: 1, backgroundColor: Theme.bg.input, borderRadius: Theme.radius.md,
    borderWidth: 1, borderColor: Theme.border.default, color: Theme.text.primary,
    paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm, fontSize: Theme.typography.sm,
  },
  addBtn: { backgroundColor: Theme.colors.burgundy500, borderRadius: Theme.radius.md, paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.sm },
  addBtnText: { color: Theme.colors.white, fontWeight: Theme.typography.weight.semiBold, fontSize: Theme.typography.sm },
  suggestLabel: { color: Theme.text.muted, fontSize: Theme.typography.xs, marginBottom: Theme.spacing.xs },
  pinBox: { marginTop: Theme.spacing.md, backgroundColor: Theme.bg.surface, borderRadius: Theme.radius.md, padding: Theme.spacing.md },
  pinTitle: { color: Theme.text.primary, fontSize: Theme.typography.md, fontWeight: Theme.typography.weight.semiBold, marginBottom: Theme.spacing.sm },
  pinError: { color: Theme.text.error, fontSize: Theme.typography.sm, marginBottom: Theme.spacing.sm },
  pinInput: {
    backgroundColor: Theme.bg.input, borderRadius: Theme.radius.md, borderWidth: 1,
    borderColor: Theme.border.default, color: Theme.text.primary, fontSize: Theme.typography.xl,
    paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.md,
    textAlign: 'center', letterSpacing: 8, marginBottom: Theme.spacing.md,
  },
  pinBtns: { flexDirection: 'row' },
});
