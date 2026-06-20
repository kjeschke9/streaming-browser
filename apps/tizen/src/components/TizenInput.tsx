import React, { useState } from 'react';
import { Colors, Typography, Spacing, Radius } from '@streambrws/ui-tokens';

interface TizenInputProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  id?: string;
}

export function TizenInput({ label, value, onChange, type = 'text', placeholder, id }: TizenInputProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: Spacing.lg }}>
      {label && (
        <label htmlFor={id} style={{
          display: 'block', color: Colors.gray300,
          fontSize: Typography.tizen.sm, fontWeight: Typography.weight.medium,
          marginBottom: Spacing.sm,
        }}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.07)',
          border: `2px solid ${focused ? Colors.gold : 'rgba(255,255,255,0.12)'}`,
          borderRadius: Radius.md, color: '#fff',
          fontSize: Typography.tizen.md, padding: `${Spacing.md}px ${Spacing.lg}px`,
          outline: 'none', minHeight: 72,
          transition: 'border-color 0.15s ease',
        }}
      />
    </div>
  );
}
