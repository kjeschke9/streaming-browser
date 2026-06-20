import React, { useRef } from 'react';
import { Colors, Typography, Spacing, Radius, FocusRing } from '@streambrws/ui-tokens';
import type { ContentTitle } from '@streambrws/shared-types';

interface TizenCardProps {
  title: ContentTitle;
  id: string;
  isHidden?: boolean;
  onSelect: (title: ContentTitle) => void;
  onLongPress?: (title: ContentTitle) => void;
}

const CARD_W = 340;
const CARD_H = 490;

export function TizenCard({ title, id, isHidden, onSelect, onLongPress }: TizenCardProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.06)';
    (e.currentTarget as HTMLDivElement).style.outline   = `${FocusRing.borderWidth}px solid ${FocusRing.borderColor}`;
    (e.currentTarget as HTMLDivElement).style.zIndex    = '10';
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
    (e.currentTarget as HTMLDivElement).style.outline   = 'none';
    (e.currentTarget as HTMLDivElement).style.zIndex    = '1';
  };

  const serviceColor = (Colors.service as any)[title.serviceId] ?? Colors.burgundy500;
  const poster = title.posterUrl ?? `https://picsum.photos/seed/${title.id}/340/490`;

  return (
    <div
      id={id}
      tabIndex={0}
      role="button"
      aria-label={`${title.title}, ${title.year}, ${title.rating}`}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onClick={() => onSelect(title)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(title); }}
      style={{
        width: CARD_W,
        height: CARD_H,
        borderRadius: Radius.md,
        overflow: 'hidden',
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'transform 0.15s ease, outline 0.1s ease',
        outlineOffset: 2,
        opacity: isHidden ? 0.45 : 1,
        background: '#1A0008',
      }}
    >
      {/* Poster */}
      <img
        src={poster}
        alt={title.title}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        loading="lazy"
      />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(26,0,8,0.95) 0%, rgba(26,0,8,0.4) 55%, transparent 100%)',
      }} />

      {/* Service badge */}
      <div style={{
        position: 'absolute', top: Spacing.sm, left: Spacing.sm,
        background: serviceColor,
        borderRadius: Radius.sm,
        padding: '4px 10px',
      }}>
        <span style={{
          color: '#fff', fontSize: Typography.tizen.xs - 4,
          fontWeight: Typography.weight.bold, letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>
          {title.serviceId.replace('_', ' ')}
        </span>
      </div>

      {/* Hidden badge */}
      {isHidden && (
        <div style={{
          position: 'absolute', top: Spacing.sm, right: Spacing.sm,
          background: Colors.burgundy500, borderRadius: Radius.sm, padding: '4px 10px',
        }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: Typography.weight.bold }}>HIDDEN</span>
        </div>
      )}

      {/* Title info */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: `${Spacing.md}px ${Spacing.md}px ${Spacing.lg}px`,
      }}>
        <div style={{
          color: '#fff', fontSize: Typography.tizen.sm,
          fontWeight: Typography.weight.bold, lineHeight: 1.25,
          marginBottom: Spacing.xs,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {title.title}
        </div>
        <div style={{ color: Colors.gray300, fontSize: Typography.tizen.xs - 2 }}>
          {title.year} · {title.rating} · {title.genres.slice(0, 2).join(', ')}
        </div>
      </div>
    </div>
  );
}
