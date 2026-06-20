import React, { useState, useEffect, useCallback } from 'react';
import { useFocusManager } from '../hooks/useFocusManager';
import { useDpad } from '../hooks/useDpad';
import { colors, spacing, typographyPresets, radius } from '@streaming/tokens';
import { ApiClient } from '@streaming/api-client';
import type { Title } from '@streaming/types';

interface WatchlistItem {
  id: string;
  title: Title;
  added_at: string;
}

interface TizenWatchlistScreenProps {
  onBack: () => void;
  onSelectTitle: (title: Title) => void;
  apiClient: ApiClient;
}

const COLS = 5;
const CARD_W = 220;
const CARD_H = 310;

export const TizenWatchlistScreen: React.FC<TizenWatchlistScreenProps> = ({
  onBack,
  onSelectTitle,
  apiClient,
}) => {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusIdx, setFocusIdx] = useState(0);
  const [removing, setRemoving] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const focusManager = useFocusManager();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const fetchWatchlist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await (apiClient as any).get('/watchlist');
      setItems(res.data ?? []);
    } catch {
      setError('Could not load watchlist. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [apiClient]);

  useEffect(() => { fetchWatchlist(); }, [fetchWatchlist]);

  const removeItem = async (id: string, titleId: string) => {
    setRemoving(titleId);
    try {
      await (apiClient as any).delete(`/watchlist/${titleId}`);
      setItems(prev => prev.filter(i => i.id !== id));
      showToast('Removed from watchlist');
      if (focusIdx >= items.length - 1) setFocusIdx(Math.max(0, items.length - 2));
    } catch {
      showToast('Failed to remove');
    } finally {
      setRemoving(null);
    }
  };

  useDpad({
    onUp: () => {
      const next = focusIdx - COLS;
      if (next >= 0) setFocusIdx(next);
    },
    onDown: () => {
      const next = focusIdx + COLS;
      if (next < items.length) setFocusIdx(next);
    },
    onLeft: () => {
      if (focusIdx % COLS === 0) { onBack(); return; }
      setFocusIdx(prev => Math.max(0, prev - 1));
    },
    onRight: () => setFocusIdx(prev => Math.min(items.length - 1, prev + 1)),
    onEnter: () => {
      if (items[focusIdx]) onSelectTitle(items[focusIdx].title);
    },
    onBack,
  });

  const styles: Record<string, React.CSSProperties> = {
    container: {
      width: '100vw',
      height: '100vh',
      background: colors.bg[950],
      display: 'flex',
      flexDirection: 'column',
      padding: `${spacing[12]} ${spacing[16]}`,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: spacing[6],
      marginBottom: spacing[10],
    },
    backBtn: {
      background: colors.bg[800],
      border: `1px solid ${colors.border[700]}`,
      borderRadius: radius.md,
      color: colors.text[200],
      padding: `${spacing[3]} ${spacing[5]}`,
      fontSize: 24,
      cursor: 'pointer',
    },
    title: {
      ...typographyPresets.heading,
      color: colors.text[50],
      fontSize: 40,
    },
    count: {
      color: colors.text[400],
      fontSize: 22,
      marginLeft: spacing[4],
    },
    grid: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: spacing[6],
      overflowY: 'auto' as const,
      flex: 1,
    },
    card: (idx: number): React.CSSProperties => ({
      width: CARD_W,
      height: CARD_H,
      borderRadius: radius.lg,
      overflow: 'hidden',
      border: `3px solid ${focusIdx === idx ? colors.accent[500] : 'transparent'}`,
      boxShadow: focusIdx === idx ? `0 0 0 4px ${colors.accent[500]}44` : 'none',
      cursor: 'pointer',
      position: 'relative',
      background: colors.bg[800],
      transition: 'border-color 0.15s, transform 0.15s',
      transform: focusIdx === idx ? 'scale(1.05)' : 'scale(1)',
    }),
    poster: {
      width: '100%',
      height: '75%',
      objectFit: 'cover' as const,
      display: 'block',
    },
    posterPlaceholder: {
      width: '100%',
      height: '75%',
      background: `linear-gradient(135deg, ${colors.bg[700]}, ${colors.bg[900]})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 48,
    },
    cardInfo: {
      padding: spacing[3],
    },
    cardTitle: {
      color: colors.text[100],
      fontSize: 16,
      fontWeight: 700,
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    cardMeta: {
      color: colors.text[400],
      fontSize: 13,
      marginTop: 2,
    },
    removeBtn: {
      position: 'absolute' as const,
      top: spacing[2],
      right: spacing[2],
      background: `${colors.bg[950]}cc`,
      border: `1px solid ${colors.border[600]}`,
      borderRadius: radius.sm,
      color: colors.text[300],
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: 13,
      cursor: 'pointer',
    },
    empty: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: colors.text[400],
      fontSize: 28,
      gap: spacing[4],
    },
    toast: {
      position: 'fixed' as const,
      bottom: spacing[10],
      left: '50%',
      transform: 'translateX(-50%)',
      background: colors.bg[800],
      border: `1px solid ${colors.accent[500]}`,
      borderRadius: radius.lg,
      color: colors.text[100],
      padding: `${spacing[3]} ${spacing[8]}`,
      fontSize: 22,
      zIndex: 1000,
    },
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <span>⏳</span>
          <span>Loading watchlist…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back</button>
        <span style={styles.title}>My Watchlist</span>
        <span style={styles.count}>{items.length} title{items.length !== 1 ? 's' : ''}</span>
      </div>

      {items.length === 0 ? (
        <div style={styles.empty}>
          <span>🎬</span>
          <span>Your watchlist is empty.</span>
          <span style={{ fontSize: 20, color: colors.text[500] }}>
            Press OK on any title to add it.
          </span>
        </div>
      ) : (
        <div style={styles.grid}>
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={styles.card(idx)}
              onClick={() => onSelectTitle(item.title)}
            >
              {item.title.poster_url ? (
                <img
                  src={item.title.poster_url}
                  alt={item.title.name}
                  style={styles.poster}
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div style={styles.posterPlaceholder}>🎬</div>
              )}
              <div style={styles.cardInfo}>
                <div style={styles.cardTitle}>{item.title.name}</div>
                <div style={styles.cardMeta}>
                  {item.title.release_year} · {item.title.content_type === 'movie' ? 'Movie' : 'TV'}
                </div>
              </div>
              {focusIdx === idx && (
                <button
                  style={styles.removeBtn}
                  onClick={e => {
                    e.stopPropagation();
                    removeItem(item.id, item.title.id);
                  }}
                  disabled={removing === item.title.id}
                >
                  {removing === item.title.id ? '…' : '✕ Remove'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div style={styles.toast}>{toast}</div>}
    </div>
  );
};

export default TizenWatchlistScreen;
