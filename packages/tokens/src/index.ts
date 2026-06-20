// ─── Design Tokens ─────────────────────────────────────────────────────────
//
// TWO alias systems are provided so both old screens (bg.base / text.primary)
// and new screens (bg[950] / text[50]) work without code changes.
//
export const colors = {
  // ── Background scale ──────────────────────────────────────────────────────
  // Named aliases (original API)
  bg: {
    void:    '#0A0A0F',
    base:    '#101018',
    surface: '#1A1A2E',
    card:    '#1E1E35',
    elevated:'#252542',
    overlay: 'rgba(0,0,0,0.72)',
    // Numeric aliases (Tailwind-style, new screens)
    950: '#0A0A0F',
    900: '#101018',
    800: '#1A1A2E',
    700: '#1E1E35',
    600: '#252542',
  } as const,

  // ── Brand ─────────────────────────────────────────────────────────────────
  brand: {
    primary:  '#7C3AED',
    purple:   '#7C3AED',   // alias for new screens
    light:    '#9D5FF3',
    dim:      '#4C1D95',
    accent:   '#06B6D4',
    accentDim:'#0E7490',
  } as const,

  // ── Safe-Feed ─────────────────────────────────────────────────────────────
  // Named aliases (original: safe.*)
  safe: {
    green:    '#10B981',
    greenDim: '#065F46',
    amber:    '#F59E0B',
    amberDim: '#92400E',
    red:      '#EF4444',
    redDim:   '#7F1D1D',
  } as const,
  // Direct aliases for new screens (colors.safeFeed.*)
  safeFeed: {
    green:    '#10B981',
    greenDim: '#065F46',
    amber:    '#F59E0B',
    amberDim: '#92400E',
    red:      '#EF4444',
    redDim:   '#7F1D1D',
  } as const,

  // ── Text ─────────────────────────────────────────────────────────────────
  text: {
    // Named aliases (original)
    primary:   '#F8FAFC',
    secondary: '#94A3B8',
    muted:     '#475569',
    disabled:  '#334155',
    inverse:   '#0A0A0F',
    // Numeric aliases (Tailwind-style, new screens)
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  } as const,

  // ── Border ───────────────────────────────────────────────────────────────
  border: {
    subtle:  '#1E293B',
    default: '#334155',
    focus:   '#7C3AED',
    dpad:    '#06B6D4',
  } as const,
} as const;

export const spacing = {
  0:   0,
  1:   4,
  2:   8,
  3:   12,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  9:   36,
  10:  40,
  11:  44,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
} as const;

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const typography = {
  family: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  size: {
    xs:    10,
    sm:    12,
    base:  14,
    md:    16,
    lg:    18,
    xl:    22,
    '2xl': 28,
    '3xl': 36,
    '4xl': 48,
  },
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const;

// ── Convenience style presets (React Native compatible) ─────────────────────
export const typographyPresets = {
  body: {
    fontSize:   14,
    fontWeight: '400' as const,
    lineHeight: 21,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  caption: {
    fontSize:   12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  label: {
    fontSize:   12,
    fontWeight: '600' as const,
    lineHeight: 16,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  heading: {
    fontSize:   22,
    fontWeight: '700' as const,
    lineHeight: 28,
    fontFamily: 'Inter, system-ui, sans-serif',
  },
} as const;

export const animation = {
  duration: {
    fast:   150,
    normal: 250,
    slow:   400,
  },
  easing: {
    ease:      'ease',
    easeIn:    'ease-in',
    easeOut:   'ease-out',
    easeInOut: 'ease-in-out',
    spring:    'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export const shadows = {
  sm:  '0 1px 3px rgba(0,0,0,0.5)',
  md:  '0 4px 12px rgba(0,0,0,0.6)',
  lg:  '0 8px 30px rgba(0,0,0,0.7)',
  glow: {
    brand: '0 0 20px rgba(124,58,237,0.4)',
    safe:  '0 0 20px rgba(16,185,129,0.4)',
    dpad:  '0 0 16px rgba(6,182,212,0.6)',
  },
} as const;

export const zIndex = {
  base:    0,
  card:    10,
  modal:   50,
  pin:     80,
  toast:   90,
  overlay: 100,
} as const;

export const tizenTokens = {
  focusScale:       1.08,
  focusBorderWidth: 3,
  cardWidth:        320,
  cardHeight:       180,
  railHeight:       220,
  headerHeight:     80,
} as const;

export type Colors      = typeof colors;
export type Spacing     = typeof spacing;
export type Radius      = typeof radius;
export type Typography  = typeof typography;
export type TizenTokens = typeof tizenTokens;
