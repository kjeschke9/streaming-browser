import React, { useEffect, useState } from 'react';
import { Colors } from '@streambrws/ui-tokens';
import { TizenSidebar } from './components/TizenSidebar';
import { TizenLoginScreen } from './components/TizenLoginScreen';
import { TizenHomeScreen } from './components/TizenHomeScreen';
import { TizenSearchScreen } from './components/TizenSearchScreen';
import { TizenSettingsScreen } from './components/TizenSettingsScreen';
import { TizenHiddenScreen } from './components/TizenHiddenScreen';
import { useTizenStore } from './tizenStore';
import { useTizenAuth } from './hooks/useAuth';
import { profileApi } from '@streambrws/shared-logic';
import type { ContentTitle } from '@streambrws/shared-types';

// PIN unlock modal for Tizen
function PinUnlockModal({ onClose }: { onClose: () => void }) {
  const { Colors: C } = { Colors };
  const [pin, setPin]         = useState('');
  const [error, setError]     = useState('');
  const { setSafeFeedUnlocked } = useTizenStore();

  const digits = [1,2,3,4,5,6,7,8,9,'',0,'⌫'] as const;

  const handlePress = (k: number | '' | '⌫') => {
    if (k === '⌫') { setPin(p => p.slice(0,-1)); return; }
    if (k === '') return;
    if (pin.length < 8) setPin(p => p + k);
  };

  const handleSubmit = async () => {
    const res = await profileApi.verifyPIN(pin);
    if (res.ok && res.data.valid) {
      setSafeFeedUnlocked(true);
      onClose();
    } else {
      setError('Incorrect PIN'); setPin('');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(26,0,8,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        background: Colors.burgundy800, borderRadius: 24,
        padding: 48, width: 480, textAlign: 'center',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <div style={{ color: '#fff', fontSize: 36, fontWeight: 900, marginBottom: 8 }}>Unlock Safe-Feed</div>
        <div style={{ color: Colors.gray400, fontSize: 22, marginBottom: 32 }}>Enter your PIN</div>

        {/* PIN dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{
              width: 20, height: 20, borderRadius: 10,
              background: i < pin.length ? Colors.gold : Colors.burgundy700,
              border: `2px solid ${i < pin.length ? Colors.gold : 'rgba(255,255,255,0.2)'}`,
              transition: 'all 0.1s ease',
            }} />
          ))}
        </div>

        {error && <div style={{ color: '#EF4444', fontSize: 20, marginBottom: 16 }}>{error}</div>}

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 24 }}>
          {digits.map((k, i) => (
            <button
              key={i}
              onClick={() => handlePress(k as any)}
              style={{
                height: 80, borderRadius: 16,
                background: k === '' ? 'transparent' : Colors.burgundy700,
                border: 'none', color: '#fff', fontSize: 32,
                cursor: k === '' ? 'default' : 'pointer',
                fontWeight: 500, outline: 'none',
                transition: 'background 0.1s ease',
              }}
              onFocus={(e) => { if (k !== '') e.currentTarget.style.background = Colors.burgundy500; }}
              onBlur={(e) => { e.currentTarget.style.background = k === '' ? 'transparent' : Colors.burgundy700; }}
            >
              {k}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '20px', borderRadius: 16, background: 'transparent',
              border: '2px solid rgba(255,255,255,0.12)', color: Colors.gray400,
              fontSize: 22, cursor: 'pointer', outline: 'none',
            }}
          >Cancel</button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1, padding: '20px', borderRadius: 16, background: Colors.burgundy500,
              border: 'none', color: '#fff', fontSize: 22, fontWeight: 700, cursor: 'pointer', outline: 'none',
            }}
          >Unlock</button>
        </div>
      </div>
    </div>
  );
}

// Title context menu
function TitleContextMenu({ title, onClose }: { title: ContentTitle; onClose: () => void }) {
  const { hideTitle } = useTizenStore();

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-end', zIndex: 9998,
    }} onClick={onClose}>
      <div
        style={{
          background: Colors.burgundy800, width: '100%', padding: 48,
          borderTop: `1px solid rgba(255,255,255,0.08)`,
          borderRadius: '24px 24px 0 0',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ color: '#fff', fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{title.title}</div>
        <div style={{ color: Colors.gray400, fontSize: 22, marginBottom: 32, textTransform: 'capitalize' }}>
          {title.year} · {title.serviceId.replace('_', ' ')} · {title.rating}
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={async () => {
              hideTitle(title.id);
              await profileApi.hideTitle(title.id, title.serviceId, title.title);
              onClose();
            }}
            style={{
              padding: '20px 40px', borderRadius: 16, background: Colors.burgundy500,
              border: 'none', color: '#fff', fontSize: 24, fontWeight: 700, cursor: 'pointer', outline: 'none',
            }}
          >👁️ Hide from feed</button>
          {title.deepLinkUrl && (
            <button
              onClick={() => { window.open(title.deepLinkUrl, '_blank'); onClose(); }}
              style={{
                padding: '20px 40px', borderRadius: 16, background: Colors.gold,
                border: 'none', color: Colors.burgundy900, fontSize: 24, fontWeight: 700, cursor: 'pointer', outline: 'none',
              }}
            >▶ Watch Now</button>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '20px 40px', borderRadius: 16, background: 'transparent',
              border: '2px solid rgba(255,255,255,0.12)', color: Colors.gray400,
              fontSize: 24, cursor: 'pointer', outline: 'none',
            }}
          >Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { activeScreen, isAuthenticated } = useTizenStore();
  const { initFromStorage } = useTizenAuth();
  const [showPinModal, setShowPinModal]       = useState(false);
  const [contextTitle, setContextTitle]       = useState<ContentTitle | null>(null);

  useEffect(() => {
    initFromStorage();
    // Register Tizen back key
    if (typeof (window as any).tizen !== 'undefined') {
      try {
        (window as any).tizen.tvinputdevice.registerKey('Back');
      } catch {}
    }
  }, []);

  if (!isAuthenticated || activeScreen === 'login') {
    return <TizenLoginScreen />;
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'home':     return <TizenHomeScreen onTitleSelect={setContextTitle} onUnlockSafeFeed={() => setShowPinModal(true)} />;
      case 'search':   return <TizenSearchScreen onTitleSelect={setContextTitle} />;
      case 'settings': return <TizenSettingsScreen />;
      case 'hidden':   return <TizenHiddenScreen />;
      default:         return <TizenHomeScreen onTitleSelect={setContextTitle} onUnlockSafeFeed={() => setShowPinModal(true)} />;
    }
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex',
      background: Colors.burgundy900, overflow: 'hidden',
      fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    }}>
      <TizenSidebar />
      <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {renderScreen()}
      </main>

      {showPinModal && <PinUnlockModal onClose={() => setShowPinModal(false)} />}
      {contextTitle && <TitleContextMenu title={contextTitle} onClose={() => setContextTitle(null)} />}
    </div>
  );
}

// Note: Import useTizenAutoSync and call it inside App() after the useEffect block:
// import { useTizenAutoSync } from './hooks/useAutoSync';
// useTizenAutoSync();
