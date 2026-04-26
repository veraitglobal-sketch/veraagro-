/**
 * Design system – aligned with web (Bio Vera #2D5A27, gray palette)
 */
export const colors = {
  primary: {
    50: '#f0f7ef',
    100: '#dcebda',
    200: '#b8d7b5',
    500: '#2D5A27',
    600: '#23471f',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '300' as const, lineHeight: 36, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 30, letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 24, letterSpacing: -0.2 },
  bodySmall: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20, letterSpacing: -0.1 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16, letterSpacing: 0 },
};
