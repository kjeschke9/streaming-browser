import React, { useState, useMemo, useRef } from 'react';
import { Colors, Typography, Spacing } from '@streambrws/ui-tokens';
import { TizenCard } from './TizenCard';
import { TizenInput } from './TizenInput';
import { useTizenStore } from '../tizenStore';
import { searchTitles } from '@streambrws/shared-logic';
import type { ContentTitle, ServiceId } from '@streambrws/shared-types';
import { MOCK_TITLES } from '../mockData';
import { useDpad } from '../hooks/useDpad';

const COLS = 5;

interface Props { onTitleSelect: (title: ContentTitle) => void; }

export function TizenSearchScreen({ onTitleSelect }: Props) {
  const [query, setQuery]         = useState('');
  const [gridIndex, setGridIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    tags, hiddenTitleIds, hiddenTitleSearchEnabled,
    serviceToggles, hiddenTitleSearchEnabled: hse,
  } = useTizenStore();

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchTitles(MOCK_TITLES as ContentTitle[], query, {
      tags: tags.map((t, i) => ({ id: String(i), userId: '', tag: t, createdAt: '' })),
      hiddenTitles: hiddenTitleIds.map((id, i) => ({
        id: String(i), userId: '', titleId: id,
        serviceId: 'netflix' as ServiceId, titleSnapshot: '', hiddenAt: '',
      })),
      hiddenTitleSearchEnabled,
      serviceToggles,
      isDirty: false,
    });
  }, [query, tags, hiddenTitleIds, hiddenTitleSearchEnabled]);

  useDpad({
    onUp:    () => setGridIndex(i => Math.max(0, i - COLS)),
    onDown:  () => setGridIndex(i => Math.min(results.length - 1, i + COLS)),
    onLeft:  () => setGridIndex(i => Math.max(0, i - 1)),
    onRight: () => setGridIndex(i => Math.min(results.length - 1, i + 1)),
    onEnter: () => { const t = results[gridIndex]; if (t) onTitleSelect(t); },
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: `${Spacing.lg}px ${Spacing.xl}px` }}>
      <h1 style={{ color: '#fff', fontSize: Typography.tizen.xl, fontWeight: 900, margin: 0, marginBottom: Spacing.lg }}>Search</h1>

      <div style={{ maxWidth: 800 }}>
        <TizenInput
          id="search-input"
          value={query}
          onChange={setQuery}
          placeholder="Search titles, genres, descriptions…"
        />
      </div>

      {hiddenTitleSearchEnabled && query.length > 0 && (
        <div style={{
          background: 'rgba(212,175,55,0.1)', borderRadius: 8,
          padding: `${Spacing.sm}px ${Spacing.md}px`,
          marginBottom: Spacing.md, display: 'inline-flex', alignItems: 'center', gap: Spacing.sm,
        }}>
          <span style={{ fontSize: 22 }}>🔍</span>
          <span style={{ color: Colors.gold, fontSize: Typography.tizen.xs }}>Hidden titles may appear in results</span>
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {query.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: Spacing.lg }}>
            <span style={{ fontSize: 80 }}>🔍</span>
            <span style={{ color: Colors.gray400, fontSize: Typography.tizen.lg }}>Start typing to search your streaming library</span>
          </div>
        ) : results.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60%', gap: Spacing.lg }}>
            <span style={{ fontSize: 80 }}>😶</span>
            <span style={{ color: Colors.gray400, fontSize: Typography.tizen.lg }}>No results for "{query}"</span>
            <span style={{ color: Colors.gray500, fontSize: Typography.tizen.sm }}>Try adjusting your exclusion tags in Settings</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: Spacing.md }}>
            {results.map((title, idx) => (
              <TizenCard
                key={title.id}
                id={`result-${title.id}`}
                title={title}
                isHidden={hiddenTitleIds.includes(title.id)}
                onSelect={onTitleSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
