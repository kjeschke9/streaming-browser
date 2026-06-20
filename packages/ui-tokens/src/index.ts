// ─── Burgundy Theme Tokens ────────────────────────────────────────────────────

export const Colors = {
  // Primary burgundy palette
  burgundy900: '#1A0008',
  burgundy800: '#3D0018',
  burgundy700: '#5C0023',
  burgundy600: '#7B0030',
  burgundy500: '#990038',   // Primary brand
  burgundy400: '#B8204F',
  burgundy300: '#D44E6E',
  burgundy200: '#E88DA0',
  burgundy100: '#F5CDD5',
  burgundy50:  '#FDF0F3',

  // Accents
  gold:        '#D4AF37',
  goldLight:   '#F0D060',
  goldDark:    '#A88A20',

  // Neutrals
  white:       '#FFFFFF',
  gray50:      '#F9FAFB',
  gray100:     '#F3F4F6',
  gray200:     '#E5E7EB',
  gray300:     '#D1D5DB',
  gray400:     '#9CA3AF',
  gray500:     '#6B7280',
  gray600:     '#4B5563',
  gray700:     '#374151',
  gray800:     '#1F2937',
  gray900:     '#111827',
  black:       '#000000',

  // Semantic
  success:     '#10B981',
  warning:     '#F59E0B',
  error:       '#EF4444',
  info:        '#3B82F6',

  // Overlays
  overlayLight: 'rgba(255,255,255,0.08)',
  overlayDark:  'rgba(0,0,0,0.6)',
  scrim:        'rgba(26,0,8,0.85)',

  // Service brand colors
  service: {
    netflix:        '#E50914',
    hulu:           '#1CE783',
    hbo_max:        '#A020F0',
    disney_plus:    '#113CCF',
    amazon_prime:   '#00A8E1',
    apple_tv:       '#555555',
    paramount_plus: '#0064FF',
    peacock:        '#FF6600',
    showtime:       '#C00',
    starz:          '#000080',
  },
} as const;

export const Typography = {
  // Mobile scale
  xs:   12,
  sm:   14,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  28,
  xxxl: 36,

  // Tizen / projector scale (1.6× multiplier)
  tizen: {
    xs:   20,
    sm:   24,
    md:   28,
    lg:   32,
    xl:   40,
    xxl:  52,
    xxxl: 64,
  },

  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semiBold:'600' as const,
    bold:    '700' as const,
    black:   '900' as const,
  },

  family: {
    sans:  'System',
    mono:  'Courier New',
  },
} as const;

export const Spacing = {
  xxs: 2,
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
  xxxl:64,
} as const;

export const Radius = {
  sm:   4,
  md:   8,
  lg:   16,
  xl:   24,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: Colors.burgundy800,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
} as const;

export const Animation = {
  fast:   150,
  normal: 250,
  slow:   400,
} as const;

// D-pad focus ring for Tizen
export const FocusRing = {
  borderWidth: 4,
  borderColor: Colors.gold,
  borderRadius: Radius.md,
} as const;
