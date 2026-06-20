/**
 * Tizen App Root — updated to include Watchlist and Detail screens.
 * Replace apps/tizen/src/App.tsx with this file.
 */

import React, { useState, useEffect } from 'react';
import { TizenHomeScreen }      from './screens/TizenHomeScreen';
import { TizenSearchScreen }    from './screens/TizenSearchScreen';
import { TizenPinScreen }       from './screens/TizenPinScreen';
import { TizenWatchlistScreen } from './screens/TizenWatchlistScreen';
import { TizenDetailScreen }    from './screens/TizenDetailScreen';
import { ApiClient }            from '@streaming/api-client';
import type { Title }           from '@streaming/types';
import { colors }               from '@streaming/tokens';

type Screen =
  | { id: 'home' }
  | { id: 'search' }
  | { id: 'watchlist' }
  | { id: 'detail'; title: Title; from: Screen }
  | { id: 'pin'; mode: 'unlock' | 'set'; from: Screen };

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

// Minimal ApiClient wrapper that reads token from localStorage
function makeApiClient(): ApiClient {
  const client = new ApiClient({ baseURL: API_BASE });
  const token = localStorage.getItem('streamhub_access_token');
  if (token) client.setAccessToken(token);
  return client;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ id: 'home' });
  const [apiClient] = useState(makeApiClient);
  const [safeFeed, setSafeFeed] = useState(false);
  const [clock, setClock] = useState('');

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  const navigate = (s: Screen) => setScreen(s);
  const goBack = () => {
    if ('from' in screen && screen.from) {
      setScreen(screen.from);
    } else {
      setScreen({ id: 'home' });
    }
  };

  const handleSelectTitle = (title: Title) => {
    navigate({ id: 'detail', title, from: screen });
  };

  const rootStyle: React.CSSProperties = {
    width: '100vw', height: '100vh',
    background: colors.bg[950],
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    position: 'relative',
  };

  const clockStyle: React.CSSProperties = {
    position: 'fixed', top: 24, right: 40,
    color: colors.text[400], fontSize: 26, zIndex: 100,
    pointerEvents: 'none',
  };

  return (
    <div style={rootStyle}>
      <div style={clockStyle}>{clock}</div>

      {screen.id === 'home' && (
        <TizenHomeScreen
          onSearch={() => navigate({ id: 'search' })}
          onWatchlist={() => navigate({ id: 'watchlist' })}
          onSelectTitle={handleSelectTitle}
          onPinRequired={() => navigate({ id: 'pin', mode: 'unlock', from: screen })}
          apiClient={apiClient}
          safeFeedActive={safeFeed}
          onSafeFeedChange={setSafeFeed}
        />
      )}

      {screen.id === 'search' && (
        <TizenSearchScreen
          onBack={() => navigate({ id: 'home' })}
          onSelectTitle={handleSelectTitle}
          apiClient={apiClient}
          safeFeedActive={safeFeed}
        />
      )}

      {screen.id === 'watchlist' && (
        <TizenWatchlistScreen
          onBack={goBack}
          onSelectTitle={handleSelectTitle}
          apiClient={apiClient}
        />
      )}

      {screen.id === 'detail' && (
        <TizenDetailScreen
          title={screen.title}
          onBack={goBack}
          apiClient={apiClient}
          safeFeedActive={safeFeed}
        />
      )}

      {screen.id === 'pin' && (
        <TizenPinScreen
          mode={screen.mode}
          onSuccess={() => {
            setSafeFeed(screen.mode === 'unlock' ? false : true);
            goBack();
          }}
          onCancel={goBack}
          apiClient={apiClient}
        />
      )}
    </div>
  );
}
