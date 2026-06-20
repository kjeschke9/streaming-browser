import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from './BurgundhyTheme';
import { useSafeFeedStore } from '../store';

interface Props {
  onUnlock: () => void;
}

export function SafeFeedBanner({ onUnlock }: Props) {
  const { enabled, isUnlocked } = useSafeFeedStore();
  if (!enabled) return null;

  return (
    <View style={[styles.banner, isUnlocked && styles.unlocked]}>
      <Text style={styles.icon}>{isUnlocked ? '🔓' : '🔒'}</Text>
      <Text style={styles.text}>
        {isUnlocked ? 'Safe-Feed Unlocked' : 'Safe-Feed Mode Active'}
      </Text>
      {!isUnlocked && (
        <TouchableOpacity onPress={onUnlock} style={styles.btn}>
          <Text style={styles.btnText}>Unlock</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.burgundy800,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Theme.border.default,
  },
  unlocked: { backgroundColor: 'rgba(16,185,129,0.15)' },
  icon: { fontSize: 16, marginRight: Theme.spacing.sm },
  text: {
    flex: 1,
    color: Theme.text.secondary,
    fontSize: Theme.typography.sm,
    fontWeight: Theme.typography.weight.medium,
  },
  btn: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 6,
    backgroundColor: Theme.colors.gold,
    borderRadius: Theme.radius.sm,
  },
  btnText: {
    color: Theme.colors.burgundy900,
    fontSize: Theme.typography.xs,
    fontWeight: Theme.typography.weight.bold,
  },
});
