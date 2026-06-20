import React, { useState } from 'react';
import {
  View, Text, ScrollView, KeyboardAvoidingView,
  Platform, StyleSheet, TouchableOpacity,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/Button';
import { TextInput } from '../components/TextInput';
import { Theme } from '../components/BurgundhyTheme';

interface Props { onNavigateLogin: () => void; }

export function RegisterScreen({ onNavigateLogin }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const { register, loading, error }  = useAuth();

  const confirmError = confirm.length > 0 && confirm !== password ? 'Passwords do not match' : undefined;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.brand}>Create Account</Text>
          <Text style={styles.tagline}>Set up your personalized streaming feed</Text>
        </View>
        <View style={styles.form}>
          <TextInput label="Display Name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <TextInput label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPw}
            placeholder="Min 8 characters"
            rightElement={
              <TouchableOpacity onPress={() => setShowPw(v => !v)}>
                <Text style={styles.eyeIcon}>{showPw ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            }
          />
          <TextInput label="Confirm Password" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPw} placeholder="Repeat password" error={confirmError} />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button label="Create Account" onPress={() => register(email, password, displayName)} loading={loading} fullWidth disabled={!!confirmError} style={{ marginTop: Theme.spacing.sm }} />
          <TouchableOpacity onPress={onNavigateLogin} style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkAccent}>Sign In</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.bg.screen },
  container: { flexGrow: 1, justifyContent: 'center', padding: Theme.spacing.xl },
  header: { alignItems: 'center', marginBottom: Theme.spacing.xxl },
  brand: { fontSize: Theme.typography.xxl, fontWeight: Theme.typography.weight.black, color: Theme.text.primary },
  tagline: { fontSize: Theme.typography.sm, color: Theme.text.muted, marginTop: Theme.spacing.xs, textAlign: 'center' },
  form: { width: '100%' },
  eyeIcon: { fontSize: 18, padding: 4 },
  error: { color: Theme.text.error, fontSize: Theme.typography.sm, marginBottom: Theme.spacing.sm, textAlign: 'center' },
  loginLink: { marginTop: Theme.spacing.lg, alignItems: 'center' },
  loginLinkText: { color: Theme.text.muted, fontSize: Theme.typography.sm },
  loginLinkAccent: { color: Theme.text.accent, fontWeight: Theme.typography.weight.semiBold },
});
