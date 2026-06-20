import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Theme } from './BurgundhyTheme';

interface TagPillProps {
  label: string;
  onRemove?: () => void;
  active?: boolean;
  style?: ViewStyle;
}

export function TagPill({ label, onRemove, active, style }: TagPillProps) {
  return (
    <TouchableOpacity
      style={[styles.pill, active && styles.active, style]}
      onPress={onRemove}
      activeOpacity={onRemove ? 0.7 : 1}
    >
      <Text style={[styles.text, active && styles.activeText]}>
        {label}{onRemove ? '  ×' : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.bg.card,
    borderWidth: 1,
    borderColor: Theme.border.default,
    marginRight: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  active: {
    backgroundColor: Theme.colors.burgundy500,
    borderColor: Theme.colors.burgundy500,
  },
  text: {
    color: Theme.text.secondary,
    fontSize: Theme.typography.sm,
    fontWeight: Theme.typography.weight.medium,
  },
  activeText: { color: Theme.colors.white },
});
