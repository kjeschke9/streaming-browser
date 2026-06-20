import React from 'react';
import { Colors, Typography, Spacing, Radius, FocusRing } from '@streambrws/ui-tokens';

interface TizenButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
  id?: string;
  fullWidth?: boolean;
}

const variants = {
  primary:   { bg: Colors.burgundy500, color: '#fff', border: 'none' },
  secondary: { bg: 'transparent', color: Colors.gold, border: `2px solid ${Colors.gold}` },
  ghost:     { bg: 'transparent', color: '#fff', border: 'none' },
  danger:    { bg: Colors.error, color: '#fff', border: 'none' },
};

export function TizenButton({ label, onClick, variant = 'primary', disabled, id, fullWidth }: TizenButtonProps) {
  const v = variants[variant];
  return (
    <button
      id={id}
      onClick={onClick}
      disabled={disabled}
      style={{
        background: v.bg, color: v.color, border: v.border ?? 'none',
        borderRadius: Radius.lg, padding: `${Spacing.md}px ${Spacing.xxl}px`,
        fontSize: Typography.tizen.md, fontWeight: Typography.weight.semiBold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        width: fullWidth ? '100%' : undefined,
        minHeight: 72, letterSpacing: 0.4,
        transition: 'transform 0.1s ease',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = `${FocusRing.borderWidth}px solid ${FocusRing.borderColor}`;
        e.currentTarget.style.transform = 'scale(1.04)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none';
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {label}
    </button>
  );
}
