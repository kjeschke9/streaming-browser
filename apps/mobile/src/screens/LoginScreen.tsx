import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Theme } from '../components/BurgundhyTheme';

interface Props {
  onNavigateRegister: () => void;
}

export function LoginScreen({ onNavigateRegister }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const { login, loading, error } = useAuth();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / wordmark */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎬</Text>
          <Text style={styles.brand}>StreamBrws</Text>
          <Text style={styles.tagline}>Your feed. Your rules.</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            placeholder="Your password"
            rightElement={
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <Button
            label="Sign In"
            onPress={() => login(email, password)}
            loading={loading}
            fullWidth
            style={{ marginTop: Theme.spacing.sm }}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            label="Create Account"
            onPress={onNavigateRegister}
            variant="secondary"
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.bg.screen },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: Theme.spacing.xxxl },
  logo:    { fontSize: 56 },
  brand: {
    fontSize: Theme.typography.xxxl,
    fontWeight: Theme.typography.weight.black,
    color: Theme.text.primary,
    letterSpacing: -0.5,
    marginTop: Theme.spacing.sm,
  },
  tagline: {
    fontSize: Theme.typography.md,
    color: Theme.text.muted,
    marginTop: Theme.spacing.xs,
  },
  form: { width: '100%' },
  eyeIcon: { fontSize: 18, padding: 4 },
  error: {
    color: Theme.text.error,
    fontSize: Theme.typography.sm,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Theme.border.default },
  dividerText: { color: Theme.text.muted, marginHorizontal: Theme.spacing.md },
});
