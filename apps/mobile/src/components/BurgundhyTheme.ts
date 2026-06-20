import { Colors, Typography, Spacing, Radius, Shadow } from '@streambrws/ui-tokens';

export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,

  // Semantic shortcuts
  bg: {
    screen:  Colors.burgundy900,
    card:    Colors.burgundy800,
    surface: Colors.burgundy700,
    input:   'rgba(255,255,255,0.07)',
    overlay: Colors.scrim,
  },
  text: {
    primary:   Colors.white,
    secondary: Colors.gray300,
    muted:     Colors.gray500,
    accent:    Colors.gold,
    error:     Colors.error,
  },
  border: {
    default: 'rgba(255,255,255,0.12)',
    focus:   Colors.gold,
    error:   Colors.error,
  },
} as const;
