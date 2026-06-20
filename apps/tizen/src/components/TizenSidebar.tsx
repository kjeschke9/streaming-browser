import React from 'react';
import { Colors, Typography, Spacing, FocusRing } from '@streambrws/ui-tokens';
import { useTizenStore } from '../tizenStore';
import { useTizenAuth } from '../hooks/useAuth';

type Screen = 'home' | 'search' | 'settings' | 'hidden' | 'login';

const NAV_ITEMS: { id: Screen; icon: string; label: string }[] = [
  { id: 'home',     icon: '🏠', label: 'Browse'   },
  { id: 'search',   icon: '🔍', label: 'Search'   },
  { id: 'hidden',   icon: '👁️', label: 'Hidden'   },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

export function TizenSidebar() {
  const { activeScreen, setScreen, safeFeedEnabled, safeFeedUnlocked, user } = useTizenStore();
  const { logout } = useTizenAuth();

  return (
    <aside style={{
      width: 220, background: Colors.burgundy800,
      display: 'flex', flexDirection: 'column',
      borderRight: `1px solid rgba(255,255,255,0.08)`,
      padding: `${Spacing.xl}px 0`,
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: `0 ${Spacing.lg}px`, marginBottom: Spacing.xxl }}>
        <div style={{ fontSize: 40 }}>🎬</div>
        <div style={{
          color: '#fff', fontSize: Typography.tizen.sm + 4,
          fontWeight: Typography.weight.black, letterSpacing: -0.5, marginTop: Spacing.xs,
        }}>StreamBrws</div>
        <div style={{ color: Colors.gray400, fontSize: Typography.tizen.xs - 2, marginTop: 2 }}>
          {user?.displayName ?? ''}
        </div>
      </div>

      {/* Safe Feed indicator */}
      {safeFeedEnabled && (
        <div style={{
          margin: `0 ${Spacing.md}px ${Spacing.lg}px`,
          background: safeFeedUnlocked ? 'rgba(16,185,129,0.15)' : 'rgba(153,0,56,0.25)',
          borderRadius: 8, padding: `${Spacing.sm}px ${Spacing.md}px`,
          display: 'flex', alignItems: 'center', gap: Spacing.sm,
        }}>
          <span style={{ fontSize: 24 }}>{safeFeedUnlocked ? '🔓' : '🔒'}</span>
          <span style={{ color: Colors.gray300, fontSize: Typography.tizen.xs }}>
            Safe-Feed {safeFeedUnlocked ? 'Unlocked' : 'Active'}
          </span>
        </div>
      )}

      {/* Nav items */}
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const active = activeScreen === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setScreen(item.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center',
                gap: Spacing.md, padding: `${Spacing.md}px ${Spacing.lg}px`,
                background: active ? Colors.burgundy700 : 'transparent',
                border: 'none', cursor: 'pointer',
                borderLeft: active ? `4px solid ${Colors.gold}` : '4px solid transparent',
                color: active ? '#fff' : Colors.gray400,
                fontSize: Typography.tizen.sm, fontWeight: Typography.weight.medium,
                textAlign: 'left', outline: 'none',
                transition: 'background 0.15s ease, color 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = `${FocusRing.borderWidth}px solid ${FocusRing.borderColor}`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
            >
              <span style={{ fontSize: 28 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={logout}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: Spacing.md,
          padding: `${Spacing.md}px ${Spacing.lg}px`, background: 'transparent',
          border: 'none', cursor: 'pointer', color: Colors.gray500,
          fontSize: Typography.tizen.sm, textAlign: 'left', outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.outline = `${FocusRing.borderWidth}px solid ${FocusRing.borderColor}`; }}
        onBlur={(e) => { e.currentTarget.style.outline = 'none'; }}
      >
        <span style={{ fontSize: 28 }}>🚪</span>
        Sign Out
      </button>
    </aside>
  );
}
