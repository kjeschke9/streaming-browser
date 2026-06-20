import React from 'react';
import { Colors, Typography, Spacing, Radius } from '@streambrws/ui-tokens';
import { TizenButton } from './TizenButton';
import { useTizenStore } from '../tizenStore';
import { profileApi } from '@streambrws/shared-logic';
import { MOCK_TITLES } from '../mockData';
import type { ContentTitle } from '@streambrws/shared-types';

export function TizenHiddenScreen() {
  const { hiddenTitleIds, unhideTitle } = useTizenStore();
  const hidden = MOCK_TITLES.filter(t => hiddenTitleIds.includes(t.id)) as ContentTitle[];

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: `${Spacing.lg}px ${Spacing.xl}px` }}>
      <h1 style={{ color: '#fff', fontSize: Typography.tizen.xl, fontWeight: 900, margin: `0 0 ${Spacing.sm}px` }}>Hidden Titles</h1>
      <p style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginBottom: Spacing.xl }}>
        {hidden.length} title{hidden.length !== 1 ? 's' : ''} hidden from your feed
      </p>

      {hidden.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', gap: Spacing.lg }}>
          <span style={{ fontSize: 80 }}>👁️</span>
          <span style={{ color: Colors.gray400, fontSize: Typography.tizen.lg }}>No hidden titles</span>
          <span style={{ color: Colors.gray500, fontSize: Typography.tizen.sm }}>Long-press a card in Browse to hide it from your feed</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: Spacing.md }}>
          {hidden.map(title => {
            const svcColor = (Colors.service as any)[title.serviceId] ?? Colors.burgundy500;
            return (
              <div key={title.id} style={{
                display: 'flex', alignItems: 'center', gap: Spacing.xl,
                background: Colors.burgundy800, borderRadius: Radius.lg,
                padding: `${Spacing.lg}px ${Spacing.xl}px`,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, background: svcColor, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#fff', fontSize: Typography.tizen.md, fontWeight: Typography.weight.semiBold }}>{title.title}</div>
                  <div style={{ color: Colors.gray400, fontSize: Typography.tizen.sm, marginTop: 4, textTransform: 'capitalize' }}>
                    {title.serviceId.replace('_', ' ')} · {title.year} · {title.rating}
                  </div>
                </div>
                <TizenButton
                  label="Unhide"
                  variant="secondary"
                  onClick={async () => {
                    unhideTitle(title.id);
                    await profileApi.unhideTitle(title.id);
                  }}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
