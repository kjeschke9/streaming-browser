import React, { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@streambrws/ui-tokens';
import { TizenButton } from './TizenButton';
import { TizenInput } from './TizenInput';
import { useTizenStore } from '../tizenStore';
import { profileApi } from '@streambrws/shared-logic';
import type { ServiceId } from '@streambrws/shared-types';
import { useDpad } from '../hooks/useDpad';

const ALL_SERVICES: { id: ServiceId; label: string; color: string }[] = [
  { id: 'netflix', label: 'Netflix', color: '#E50914' },
  { id: 'hulu', label: 'Hulu', color: '#1CE783' },
  { id: 'hbo_max', label: 'HBO Max', color: '#A020F0' },
  { id: 'disney_plus', label: 'Disney+', color: '#113CCF' },
  { id: 'amazon_prime', label: 'Prime Video', color: '#00A8E1' },
  { id: 'apple_tv', label: 'Apple TV+', color: '#888888' },
  { id: 'paramount_plus', label: 'Paramount+', color: '#0064FF' },
  { id: 'peacock', label: 'Peacock', color: '#FF6600' },
  { id: 'showtime', label: 'Showtime', color: '#CC0000' },
  { id: 'starz', label: 'Starz', color: '#000099' },
];

const SUGGESTED_TAGS = ['horror','violence','political','adult','anime','reality-tv','crime','war','documentary'];

export function TizenSettingsScreen() {
  const {
    tags, addTag, removeTag, toggleService, serviceToggles,
    hiddenTitleSearchEnabled, setHiddenSearch,
    safeFeedEnabled, hasPinSet, setSafeFeedEnabled,
    user,
  } = useTizenStore();

  const [newTag, setNewTag]       = useState('');
  const [pinView, setPinView]     = useState<'none'|'set'|'verify'>('none');
  const [pinInput, setPinInput]   = useState('');
  const [pinError, setPinError]   = useState('');

  const handleAddTag = async () => {
    const t = newTag.trim().toLowerCase();
    if (!t || tags.includes(t)) return;
    addTag(t);
    await profileApi.addExclusionTag(t);
    setNewTag('');
  };

  const handleSetPin = async () => {
    if (pinInput.length < 4) { setPinError('PIN must be at least 4 digits'); return; }
    const ok = await profileApi.setPIN(pinInput);
    if (ok) {
      useTizenStore.getState().setHasPinSet(true);
      setPinView('none'); setPinInput(''); setPinError('');
    }
  };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: `${Spacing.lg}px ${Spacing.xl}px` }}>
      <h1 style={{ color: '#fff', fontSize: Typography.tizen.xl, fontWeight: 900, margin: `0 0 ${Spacing.xl}px` }}>Settings</h1>

      {/* ─── Account ─────────────────────────────────────────────── */}
      <Section title="ACCOUNT">
        <div style={{ display: 'flex', alignItems: 'center', gap: Spacing.lg }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: Colors.burgundy500, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
            👤
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: Typography.tizen.md, fontWeight: Typography.weight.bold }}>{user?.displayName ?? 'User'}</div>
            <div style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginTop: 4 }}>{user?.email}</div>
          </div>
        </div>
      </Section>

      {/* ─── Service Toggles ─────────────────────────────────────── */}
      <Section title="STREAMING SERVICES">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: Spacing.sm }}>
          {ALL_SERVICES.map(svc => {
            const enabled = serviceToggles[svc.id] !== false;
            return (
              <button
                key={svc.id}
                onClick={() => toggleService(svc.id, !enabled)}
                style={{
                  display: 'flex', alignItems: 'center', gap: Spacing.md,
                  background: enabled ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                  border: `2px solid ${enabled ? svc.color : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: Radius.md, padding: `${Spacing.md}px ${Spacing.lg}px`,
                  cursor: 'pointer', color: enabled ? '#fff' : Colors.gray500,
                  fontSize: Typography.tizen.sm, fontWeight: Typography.weight.medium,
                  outline: 'none', textAlign: 'left', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: 6, background: enabled ? svc.color : Colors.gray600 }} />
                {svc.label}
                <span style={{ marginLeft: 'auto', fontSize: 20 }}>{enabled ? '✅' : '⬜'}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ─── Exclusion Tags ──────────────────────────────────────── */}
      <Section title="GLOBAL EXCLUSION TAGS">
        <p style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginTop: 0 }}>
          Content with these genres/keywords is hidden everywhere.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md }}>
          {tags.map(tag => (
            <button
              key={tag}
              onClick={() => removeTag(tag)}
              style={{
                background: Colors.burgundy500, border: 'none', borderRadius: 100,
                padding: `${Spacing.sm}px ${Spacing.md}px`, color: '#fff',
                fontSize: Typography.tizen.sm, cursor: 'pointer', outline: 'none',
              }}
            >
              {tag} ×
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: Spacing.md, maxWidth: 600 }}>
          <div style={{ flex: 1 }}>
            <TizenInput value={newTag} onChange={setNewTag} placeholder="Add tag (e.g. horror)" />
          </div>
          <TizenButton label="Add" onClick={handleAddTag} />
        </div>
        <div style={{ marginTop: Spacing.sm }}>
          <span style={{ color: Colors.gray500, fontSize: Typography.tizen.xs }}>Suggestions: </span>
          {SUGGESTED_TAGS.filter(t => !tags.includes(t)).slice(0, 5).map(t => (
            <button
              key={t}
              onClick={() => { addTag(t); profileApi.addExclusionTag(t); }}
              style={{
                background: 'transparent', border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 100,
                padding: `${Spacing.xs}px ${Spacing.sm}px`, color: Colors.gray400,
                fontSize: Typography.tizen.xs, cursor: 'pointer', marginRight: Spacing.sm, marginTop: Spacing.xs, outline: 'none',
              }}
            >+ {t}</button>
          ))}
        </div>
      </Section>

      {/* ─── Hidden Title Search ─────────────────────────────────── */}
      <Section title="HIDDEN TITLES IN SEARCH">
        <ToggleRow
          label="Show hidden titles in search results"
          hint="When on, hidden titles appear (dimmed) in search results"
          checked={hiddenTitleSearchEnabled}
          onChange={setHiddenSearch}
        />
      </Section>

      {/* ─── Safe-Feed ───────────────────────────────────────────── */}
      <Section title="SAFE-FEED MODE">
        <ToggleRow
          label="Safe-Feed Enabled"
          hint={hasPinSet ? 'Restrict browsing to approved content. PIN required to disable.' : 'Set a PIN first to enable Safe-Feed.'}
          checked={safeFeedEnabled}
          onChange={async (v) => {
            if (!hasPinSet && v) { setPinView('set'); return; }
            setSafeFeedEnabled(v);
            await profileApi.updateSafeFeed({ enabled: v });
          }}
        />
        <div style={{ marginTop: Spacing.md }}>
          <TizenButton
            label={hasPinSet ? 'Change PIN' : 'Set PIN'}
            variant="secondary"
            onClick={() => setPinView('set')}
          />
        </div>
        {pinView !== 'none' && (
          <div style={{
            marginTop: Spacing.lg, background: 'rgba(255,255,255,0.05)',
            borderRadius: Radius.md, padding: Spacing.lg, maxWidth: 400,
          }}>
            <div style={{ color: '#fff', fontSize: Typography.tizen.md, fontWeight: Typography.weight.bold, marginBottom: Spacing.md }}>
              {pinView === 'set' ? '🔐 Set New PIN' : '🔒 Enter PIN'}
            </div>
            {pinError && <div style={{ color: Colors.error, fontSize: Typography.tizen.sm, marginBottom: Spacing.sm }}>{pinError}</div>}
            <TizenInput value={pinInput} onChange={setPinInput} type="password" placeholder="Enter PIN (4–8 digits)" />
            <div style={{ display: 'flex', gap: Spacing.md }}>
              <TizenButton label="Cancel" variant="ghost" onClick={() => { setPinView('none'); setPinInput(''); setPinError(''); }} />
              <TizenButton label="Confirm" onClick={handleSetPin} />
            </div>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: Spacing.xxl }}>
      <div style={{
        color: Colors.gray500, fontSize: Typography.tizen.xs,
        fontWeight: Typography.weight.bold, letterSpacing: 1.5,
        marginBottom: Spacing.md, textTransform: 'uppercase',
      }}>{title}</div>
      <div style={{
        background: Colors.burgundy800, borderRadius: Radius.lg,
        padding: `${Spacing.lg}px ${Spacing.xl}px`,
        border: '1px solid rgba(255,255,255,0.06)',
      }}>{children}</div>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: {
  label: string; hint: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: Spacing.xl }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: '#fff', fontSize: Typography.tizen.md, fontWeight: Typography.weight.medium }}>{label}</div>
        <div style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginTop: 4 }}>{hint}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 80, height: 44, borderRadius: 22,
          background: checked ? Colors.burgundy500 : Colors.gray700,
          border: 'none', cursor: 'pointer', position: 'relative',
          transition: 'background 0.2s ease', flexShrink: 0, outline: 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 4,
          left: checked ? 40 : 4,
          width: 36, height: 36, borderRadius: 18,
          background: '#fff', transition: 'left 0.2s ease',
        }} />
      </button>
    </div>
  );
}
