import React, { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@streambrws/ui-tokens';
import { TizenButton } from './TizenButton';
import { TizenInput } from './TizenInput';
import { useTizenAuth } from '../hooks/useAuth';
import { useDpad } from '../hooks/useDpad';

type View = 'login' | 'register';

export function TizenLoginScreen() {
  const [view, setView]           = useState<View>('login');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [displayName, setDN]      = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const { login } = useTizenAuth();

  const { authApi } = (() => {
    // Inline register for Tizen (avoids extra hook file)
    const { authApi: a } = require('@streambrws/shared-logic') as any;
    const { setAccessToken: sat, profileApi: pa } = require('@streambrws/shared-logic') as any;
    const store = require('../tizenStore') as any;
    return {
      authApi: {
        register: async () => {
          const res = await a.register({ email, password, displayName });
          if (!res.ok) return { ok: false, error: res.error };
          sat(res.data.accessToken);
          store.useTizenStore.getState().setTokens(res.data.accessToken, res.data.refreshToken);
          const pr = await pa.getProfile();
          if (pr.ok) store.useTizenStore.getState().loadFromProfile(pr.data);
          store.useTizenStore.getState().setScreen('home');
          return { ok: true };
        },
      },
    };
  })();

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = view === 'login'
        ? await login(email, password)
        : await authApi.register();
      if (!res.ok) setError(res.error ?? 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useDpad({ onEnter: handleSubmit });

  return (
    <div style={{
      minHeight: '100vh', background: Colors.burgundy900,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 640, background: Colors.burgundy800,
        borderRadius: Radius.xl, padding: Spacing.xxxl,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: Spacing.xxl }}>
          <div style={{ fontSize: 72, lineHeight: 1 }}>🎬</div>
          <div style={{
            color: '#fff', fontSize: Typography.tizen.xxl,
            fontWeight: Typography.weight.black, letterSpacing: -1, marginTop: Spacing.sm,
          }}>StreamBrws</div>
          <div style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginTop: Spacing.xs }}>
            Your feed. Your rules.
          </div>
        </div>

        {/* Tab toggle */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)',
          borderRadius: Radius.lg, padding: 4, marginBottom: Spacing.xl,
        }}>
          {(['login', 'register'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => { setView(v); setError(''); }}
              style={{
                flex: 1, padding: `${Spacing.md}px`,
                background: view === v ? Colors.burgundy500 : 'transparent',
                border: 'none', borderRadius: Radius.md,
                color: view === v ? '#fff' : Colors.gray400,
                fontSize: Typography.tizen.sm, fontWeight: Typography.weight.semiBold,
                cursor: 'pointer', outline: 'none',
                transition: 'all 0.15s ease',
                textTransform: 'capitalize',
              }}
            >{v === 'login' ? 'Sign In' : 'Create Account'}</button>
          ))}
        </div>

        {view === 'register' && (
          <TizenInput id="displayname" label="Display Name" value={displayName} onChange={setDN} placeholder="Your name" />
        )}
        <TizenInput id="email" label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <TizenInput id="password" label="Password" type="password" value={password} onChange={setPassword} placeholder="Your password" />

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: Radius.sm, padding: `${Spacing.sm}px ${Spacing.md}px`,
            color: '#EF4444', fontSize: Typography.tizen.sm, marginBottom: Spacing.md,
          }}>{error}</div>
        )}

        <TizenButton
          label={loading ? 'Please wait…' : view === 'login' ? 'Sign In' : 'Create Account'}
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
        />

        <div style={{ textAlign: 'center', marginTop: Spacing.lg, color: Colors.gray500, fontSize: Typography.tizen.xs }}>
          Use your remote's D-pad to navigate · Press Enter/OK to select
        </div>
      </div>
    </div>
  );
}
