import React, { useState, useEffect } from 'react';
import { useDpad } from '../hooks/useDpad';
import { colors, spacing, typographyPresets, radius } from '@streaming/tokens';
import { ApiClient } from '@streaming/api-client';
import type { Title } from '@streaming/types';

interface TizenDetailScreenProps {
  title: Title;
  onBack: () => void;
  apiClient: ApiClient;
  safeFeedActive?: boolean;
}

type ActionId = 'watch' | 'watchlist' | 'hide' | 'back';
const ACTIONS: { id: ActionId; label: string; icon: string }[] = [
  { id: 'back',      label: 'Back',              icon: '←' },
  { id: 'watch',     label: 'Watch Now',          icon: '▶' },
  { id: 'watchlist', label: 'Add to Watchlist',   icon: '＋' },
  { id: 'hide',      label: 'Hide This Title',    icon: '🚫' },
];

const SERVICE_URLS: Record<string, string> = {
  netflix:     'https://www.netflix.com/search?q=',
  prime:       'https://www.amazon.com/s?k=',
  hulu:        'https://www.hulu.com/search?q=',
  disney:      'https://www.disneyplus.com/search/',
  max:         'https://www.max.com/search?q=',
  apple:       'https://tv.apple.com/search?term=',
  peacock:     'https://www.peacocktv.com/search?q=',
  paramount:   'https://www.paramountplus.com/search/',
  crunchyroll: 'https://www.crunchyroll.com/search?q=',
};

export const TizenDetailScreen: React.FC<TizenDetailScreenProps> = ({
  title,
  onBack,
  apiClient,
  safeFeedActive = false,
}) => {
  const [focusIdx, setFocusIdx] = useState(1); // default: Watch Now
  const [inWatchlist, setInWatchlist] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    // Check if already in watchlist
    (apiClient as any).get('/watchlist').then((res: any) => {
      const ids: string[] = (res.data ?? []).map((w: any) => w.title?.id);
      setInWatchlist(ids.includes(title.id));
    }).catch(() => {});
  }, [title.id]);

  const actions = ACTIONS.map(a =>
    a.id === 'watchlist'
      ? { ...a, label: inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist', icon: inWatchlist ? '✓' : '＋' }
      : a
  );

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAction = async (id: ActionId) => {
    if (id === 'back') { onBack(); return; }

    if (id === 'watch') {
      const serviceKey = (title.service_ids?.[0] ?? '').toLowerCase();
      const base = SERVICE_URLS[serviceKey] ?? `https://www.google.com/search?q=`;
      const url = `${base}${encodeURIComponent(title.name)}`;
      window.open(url, '_blank');
      return;
    }

    if (id === 'watchlist') {
      setLoadingAction(true);
      try {
        if (inWatchlist) {
          await (apiClient as any).delete(`/watchlist/${title.id}`);
          setInWatchlist(false);
          showToast('Removed from watchlist');
        } else {
          await (apiClient as any).post('/watchlist', { title_id: title.id });
          setInWatchlist(true);
          showToast('Added to watchlist ✓');
        }
      } catch {
        showToast('Action failed', false);
      } finally {
        setLoadingAction(false);
      }
      return;
    }

    if (id === 'hide') {
      setLoadingAction(true);
      try {
        await (apiClient as any).post('/exclusions/hidden', { title_id: title.id });
        showToast('Title hidden');
        setTimeout(() => onBack(), 1200);
      } catch {
        showToast('Could not hide title', false);
      } finally {
        setLoadingAction(false);
      }
    }
  };

  useDpad({
    onLeft:  () => setFocusIdx(prev => Math.max(0, prev - 1)),
    onRight: () => setFocusIdx(prev => Math.min(actions.length - 1, prev + 1)),
    onEnter: () => handleAction(actions[focusIdx].id),
    onBack,
  });

  const rating = title.content_rating ?? (title.tags?.includes('kids') ? 'TV-G' : 'NR');
  const year   = title.release_year ?? '';
  const genres = title.genres?.slice(0, 4).join(' · ') ?? '';
  const desc   = title.description ?? 'No description available.';
  const service = title.service_ids?.[0] ?? '';

  const s: Record<string, React.CSSProperties> = {
    root: {
      width: '100vw', height: '100vh',
      background: colors.bg[950],
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    },
    backdrop: {
      position: 'absolute', top: 0, left: 0, right: 0, height: '55%',
      background: title.backdrop_url
        ? `url(${title.backdrop_url}) center/cover no-repeat`
        : `linear-gradient(135deg, ${colors.bg[800]}, ${colors.bg[900]})`,
    },
    backdropFade: {
      position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%',
      background: `linear-gradient(to bottom, transparent, ${colors.bg[950]})`,
    },
    content: {
      position: 'absolute', bottom: 0, left: 0, right: 0, top: '30%',
      display: 'flex', flexDirection: 'column',
      padding: `0 ${spacing[16]} ${spacing[10]}`,
      gap: spacing[5],
    },
    titleText: {
      ...typographyPresets.heading,
      fontSize: 56, color: colors.text[50],
      textShadow: '0 2px 12px #000a',
      lineHeight: 1.15,
    },
    metaRow: {
      display: 'flex', alignItems: 'center',
      gap: spacing[4], flexWrap: 'wrap' as const,
    },
    badge: (color: string): React.CSSProperties => ({
      background: color, borderRadius: radius.sm,
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: 18, fontWeight: 700, color: '#fff',
    }),
    metaText: { color: colors.text[300], fontSize: 20 },
    desc: {
      color: colors.text[200], fontSize: 22, lineHeight: 1.5,
      maxWidth: 900, display: '-webkit-box',
      WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const,
      overflow: 'hidden',
    },
    actions: {
      display: 'flex', gap: spacing[5], marginTop: spacing[2],
    },
    actionBtn: (focused: boolean): React.CSSProperties => ({
      display: 'flex', alignItems: 'center', gap: spacing[3],
      padding: `${spacing[4]} ${spacing[7]}`,
      borderRadius: radius.lg,
      border: `2px solid ${focused ? colors.accent[400] : colors.border[700]}`,
      background: focused ? colors.accent[600] : `${colors.bg[800]}cc`,
      color: focused ? '#fff' : colors.text[300],
      fontSize: 22, fontWeight: focused ? 700 : 400,
      cursor: 'pointer',
      transform: focused ? 'scale(1.06)' : 'scale(1)',
      transition: 'all 0.15s',
      boxShadow: focused ? `0 0 20px ${colors.accent[500]}66` : 'none',
    }),
    safeTag: {
      position: 'absolute' as const, top: spacing[6], right: spacing[8],
      background: '#065f46', border: '1px solid #6ee7b7',
      borderRadius: radius.md, color: '#6ee7b7',
      padding: `${spacing[2]} ${spacing[5]}`, fontSize: 20, fontWeight: 700,
    },
    toast: {
      position: 'fixed' as const, bottom: spacing[10], left: '50%',
      transform: 'translateX(-50%)',
      background: colors.bg[800],
      border: `1px solid ${toast?.ok ? colors.accent[500] : '#f87171'}`,
      borderRadius: radius.lg, color: colors.text[100],
      padding: `${spacing[3]} ${spacing[8]}`, fontSize: 22, zIndex: 9999,
    },
  };

  return (
    <div style={s.root}>
      {/* Backdrop */}
      <div style={s.backdrop}>
        <div style={s.backdropFade} />
      </div>

      {safeFeedActive && <div style={s.safeTag}>🛡 Safe Feed</div>}

      {/* Main content */}
      <div style={s.content}>
        <div style={s.titleText}>{title.name}</div>

        <div style={s.metaRow}>
          {rating && (
            <span style={s.badge('#7c3aed')}>{rating}</span>
          )}
          {year && <span style={s.metaText}>{year}</span>}
          {service && (
            <span style={s.badge('#1e3a5f')}>
              {service.charAt(0).toUpperCase() + service.slice(1)}
            </span>
          )}
          {title.content_type && (
            <span style={s.metaText}>
              {title.content_type === 'movie' ? '🎬 Movie' : '📺 Series'}
            </span>
          )}
          {genres && <span style={{ ...s.metaText, color: colors.text[400] }}>{genres}</span>}
        </div>

        <div style={s.desc}>{desc}</div>

        <div style={s.actions}>
          {actions.map((a, i) => (
            <button
              key={a.id}
              style={s.actionBtn(focusIdx === i)}
              onClick={() => handleAction(a.id)}
              disabled={loadingAction && (a.id === 'watchlist' || a.id === 'hide')}
            >
              <span>{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && <div style={s.toast}>{toast.msg}</div>}
    </div>
  );
};

export default TizenDetailScreen;
