/**
 * Bio Vera design tokens — single source for web + mobile.
 * Web: globals.css / premium-classes.ts should mirror these values.
 */
export const vera = {
  color: {
    primary: '#2D5A27',
    primaryHover: '#23471f',
    canvas: '#f6f5f1',
    surface: '#ffffff',
    border: '#e5e2db',
    borderNeutral: '#E5E7EB',
    tint: '#f7faf6',
    muted: '#6b7280',
    foreground: '#171717',
    gray900: '#111827',
    gray700: '#374151',
    gray600: '#4B5563',
    gray200: '#E5E7EB',
    gray100: '#F3F4F6',
    destructive: '#991B1B',
    destructiveBorder: '#FECACA',
    destructiveText: '#B91C1C',
    wash: 'rgba(45, 90, 39, 0.07)',
    primaryTint: 'rgba(45, 90, 39, 0.08)',
    primaryTintStrong: 'rgba(45, 90, 39, 0.12)',
    premiumTintBg: 'rgba(45, 90, 39, 0.05)',
    premiumTintBorder: 'rgba(45, 90, 39, 0.14)',
    secondaryBorder: '#d8d4cb',
    secondaryHover: '#faf9f6',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },
  touch: {
    min: 44,
    cta: 48,
    large: 52,
    farmer: 56,
  },
  type: {
    eyebrow: 11,
    caption: 13,
    body: 15,
    bodyLarge: 16,
    sectionTitle: 17,
    pageTitle: 28,
    weight: {
      light: '300' as const,
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
    },
  },
} as const;

export type VeraTokens = typeof vera;
