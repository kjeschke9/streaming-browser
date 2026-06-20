import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator,
  StyleSheet, ViewStyle, TextStyle,
} from 'react-native';
import { Theme } from './BurgundhyTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: Theme.colors.burgundy500, text: Theme.colors.white },
  secondary: { bg: 'transparent', text: Theme.colors.gold, border: Theme.colors.gold },
  ghost:     { bg: 'transparent', text: Theme.colors.white },
  danger:    { bg: Theme.colors.error, text: Theme.colors.white },
};

export function Button({
  label, onPress, variant = 'primary', loading, disabled, fullWidth, style, textStyle,
}: ButtonProps) {
  const vs = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        { backgroundColor: vs.bg },
        vs.border ? { borderWidth: 1.5, borderColor: vs.border } : null,
        fullWidth && styles.full,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={vs.text} size="small" />
        : <Text style={[styles.label, { color: vs.text }, textStyle]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  full: { width: '100%' },
  label: {
    fontSize: Theme.typography.md,
    fontWeight: Theme.typography.weight.semiBold,
    letterSpacing: 0.4,
  },
  disabled: { opacity: 0.45 },
});
