import React, { useState } from 'react';
import {
  TextInput as RNTextInput, View, Text, TouchableOpacity,
  StyleSheet, TextInputProps,
} from 'react-native';
import { Theme } from './BurgundhyTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function TextInput({ label, error, rightElement, style, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        focused && styles.focused,
        error ? styles.errored : null,
      ]}>
        <RNTextInput
          {...props}
          placeholderTextColor={Theme.colors.gray500}
          style={[styles.input, style]}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        />
        {rightElement}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: Theme.spacing.md },
  label: {
    fontSize: Theme.typography.sm,
    color: Theme.text.secondary,
    marginBottom: Theme.spacing.xs,
    fontWeight: Theme.typography.weight.medium,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.bg.input,
    borderRadius: Theme.radius.md,
    borderWidth: 1.5,
    borderColor: Theme.border.default,
    paddingHorizontal: Theme.spacing.md,
  },
  focused: { borderColor: Theme.border.focus },
  errored: { borderColor: Theme.border.error },
  input: {
    flex: 1,
    color: Theme.text.primary,
    fontSize: Theme.typography.md,
    paddingVertical: Theme.spacing.md,
    minHeight: 50,
  },
  error: {
    fontSize: Theme.typography.xs,
    color: Theme.text.error,
    marginTop: Theme.spacing.xs,
  },
});
