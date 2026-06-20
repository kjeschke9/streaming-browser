import React, { useMemo, useState, useCallback } from 'react';
import { Colors, Typography, Spacing, FocusRing } from '@streambrws/ui-tokens';
import { TizenCard } from './TizenCard';
import { useTizenStore } from '../tizenStore';
import { applyExclusions, applySafeFeed } from '@streambrws/shared-logic';
import type { ContentTitle, ServiceId } from '@streambrws/shared-types';
import { MOCK_TITLES } from '../mockData';
import { useDpad } from '../hooks/useDpad';

const COLS = 5;
const SERVICE_FILTERS: { id: ServiceId | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'netflix', label: 'Netflix' },
  { id: 'hulu', label: 'Hulu' },
  { id: 'hbo_max', label: 'HBO Max' },
  { id: 'disney_plus', label: 'Disney+' },
  { id: 'amazon_prime', label: 'Prime' },
  { id: 'apple_tv', label: 'Apple TV+' },
  { id: 'paramount_plus', label: 'Paramount+' },
  { id: 'peacock', label: 'Peacock' },
];

interface Props {
  onTitleSelect: (title: ContentTitle) => void;
  onUnlockSafeFeed: () => void;
}

export function TizenHomeScreen({ onTitleSelect, onUnlockSafeFeed }: Props) {
  const [activeFilter, setActiveFilter] = useState<ServiceId | 'all'>('all');
  const [focusRow, setFocusRow]         = useState<'filter' | 'grid'>('filter');
  const [filterIndex, setFilterIndex]   = useState(0);
  const [gridIndex, setGridIndex]       = useState(0);

  const {
    tags, hiddenTitleIds, hiddenTitleSearchEnabled,
    serviceToggles, safeFeedEnabled, safeFeedUnlocked, hasPinSet,
    allowedServiceIds, allowedTags,
  } = useTizenStore();

  const filtered = useMemo(() => {
    let titles = MOCK_TITLES as ContentTitle[];
    if (activeFilter !== 'all') titles = titles.filter(t => t.serviceId === activeFilter);
    titles = applyExclusions(titles, {
      tags: tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
      hiddenTitles: hiddenTitleIds.map((id, i) => ({
        id: String(i), userId: '', titleId: id,
        serviceId: 'netflix' as ServiceId, titleSnapshot: '', hiddenAt: '',
      })),
      hiddenTitleSearchEnabled,
      serviceToggles,
      isDirty: false,
    });
    if (safeFeedEnabled && !safeFeedUnlocked) {
      titles = applySafeFeed(titles, {
        enabled: safeFeedEnabled,
        hasPinSet,
        allowedServiceIds,
        allowedTags,
      }, safeFeedUnlocked);
    }
    return titles;
  }, [activeFilter, tags, hiddenTitleIds, serviceToggles, safeFeedEnabled, safeFeedUnlocked]);

  useDpad({
    onUp: () => {
      if (focusRow === 'grid') { setFocusRow('filter'); }
      else { setGridIndex(i => Math.max(0, i - COLS)); }
    },
    onDown: () => {
      if (focusRow === 'filter') { setFocusRow('grid'); }
      else { setGridIndex(i => Math.min(filtered.length - 1, i + COLS)); }
    },
    onLeft: () => {
      if (focusRow === 'filter') setFilterIndex(i => Math.max(0, i - 1));
      else setGridIndex(i => Math.max(0, i - 1));
    },
    onRight: () => {
      if (focusRow === 'filter') setFilterIndex(i => Math.min(SERVICE_FILTERS.length - 1, i + 1));
      else setGridIndex(i => Math.min(filtered.length - 1, i + 1));
    },
    onEnter: () => {
      if (focusRow === 'filter') {
        const svc = SERVICE_FILTERS[filterIndex];
        if (svc) setActiveFilter(svc.id);
      } else {
        const t = filtered[gridIndex];
        if (t) onTitleSelect(t);
      }
    },
  });

  const currentTitle = focusRow === 'grid' ? filtered[gridIndex] : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Safe-Feed banner */}
      {safeFeedEnabled && (
        <div style={{
          background: safeFeedUnlocked ? 'rgba(16,185,129,0.15)' : Colors.burgundy800,
          padding: `${Spacing.sm}px ${Spacing.xl}px`,
          display: 'flex', alignItems: 'center', gap: Spacing.md,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <span style={{ fontSize: 28 }}>{safeFeedUnlocked ? '🔓' : '🔒'}</span>
          <span style={{ color: Colors.gray300, fontSize: Typography.tizen.sm, flex: 1 }}>
            Safe-Feed Mode {safeFeedUnlocked ? 'Unlocked' : 'Active'}
          </span>
          {!safeFeedUnlocked && (
            <button
              onClick={onUnlockSafeFeed}
              style={{
                background: Colors.gold, color: Colors.burgundy900,
                border: 'none', borderRadius: 8,
                padding: `${Spacing.sm}px ${Spacing.lg}px`,
                fontSize: Typography.tizen.sm, fontWeight: Typography.weight.bold, cursor: 'pointer',
              }}
            >
              Unlock
            </button>
          )}
        </div>
      )}

      {/* Page title */}
      <div style={{ padding: `${Spacing.lg}px ${Spacing.xl}px ${Spacing.sm}px` }}>
        <h1 style={{
          color: '#fff', fontSize: Typography.tizen.xl, fontWeight: Typography.weight.black,
          margin: 0, letterSpacing: -1,
        }}>Browse</h1>
        <p style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, margin: `${Spacing.xs}px 0 0` }}>
          {filtered.length} title{filtered.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* Service filter row */}
      <div style={{
        display: 'flex', gap: Spacing.sm, padding: `${Spacing.sm}px ${Spacing.xl}px`,
        overflowX: 'auto', flexShrink: 0,
      }}>
        {SERVICE_FILTERS.map((svc, idx) => (
          <button
            key={svc.id}
            onClick={() => { setActiveFilter(svc.id); setFilterIndex(idx); setFocusRow('filter'); }}
            style={{
              flexShrink: 0,
              padding: `${Spacing.sm}px ${Spacing.lg}px`,
              borderRadius: 100,
              background: activeFilter === svc.id ? Colors.burgundy500 : Colors.burgundy800,
              border: `2px solid ${focusRow === 'filter' && filterIndex === idx ? Colors.gold : 'rgba(255,255,255,0.12)'}`,
              color: activeFilter === svc.id ? '#fff' : Colors.gray300,
              fontSize: Typography.tizen.sm, fontWeight: Typography.weight.medium,
              cursor: 'pointer', outline: 'none',
              transform: focusRow === 'filter' && filterIndex === idx ? 'scale(1.08)' : 'scale(1)',
              transition: 'all 0.12s ease',
            }}
          >
            {svc.label}
          </button>
        ))}
      </div>

      {/* Title grid */}
      <div style={{
        flex: 1, overflowY: 'auto', padding: `${Spacing.md}px ${Spacing.xl}px ${Spacing.xl}px`,
      }}>
        {filtered.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60%', gap: Spacing.md,
          }}>
            <span style={{ fontSize: 72 }}>🎭</span>
            <span style={{ color: Colors.gray400, fontSize: Typography.tizen.lg }}>No titles match your filters</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: Spacing.md }}>
            {filtered.map((title, idx) => (
              <div
                key={title.id}
                style={{
                  outline: focusRow === 'grid' && gridIndex === idx
                    ? `${FocusRing.borderWidth}px solid ${FocusRing.borderColor}`
                    : 'none',
                  borderRadius: 10,
                  transform: focusRow === 'grid' && gridIndex === idx ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform 0.12s ease, outline 0.1s ease',
                  zIndex: focusRow === 'grid' && gridIndex === idx ? 10 : 1,
                  position: 'relative',
                }}
                onClick={() => { setGridIndex(idx); setFocusRow('grid'); onTitleSelect(title); }}
              >
                <TizenCard
                  id={`title-${title.id}`}
                  title={title}
                  isHidden={hiddenTitleIds.includes(title.id)}
                  onSelect={onTitleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
