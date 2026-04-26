/**
 * Bio Vera mobile theme – aligned with web (biovera.app)
 * Primary #2D5A27, clean minimal look
 */
export const theme = {
  colors: {
    // Brand – same as web
    primary: '#2D5A27',
    primaryHover: '#23471f',
    primaryLight: 'rgba(45, 90, 39, 0.08)',
    accent: '#2D5A27', // same as primary (compat)

    // Neutral – match web (white, gray-200, gray-600, gray-900)
    background: '#FFFFFF',
    surface: '#F8F9FA',
    surfaceElevated: '#FFFFFF',

    text: {
      primary: '#171717',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      inverse: '#FFFFFF',
    },

    // Status
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',

    // Border – match web (gray-200)
    border: '#E5E7EB',
    borderLight: '#F3F4F6',

    shadow: 'rgba(0, 0, 0, 0.08)',
    shadowDark: 'rgba(0, 0, 0, 0.12)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },

  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
  },

  // Tipografija u duhu weba – font-light / font-normal, letter-spacing -0.01
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '300' as const,
      lineHeight: 36,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 30,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 26,
      letterSpacing: -0.2,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 24,
      letterSpacing: -0.2,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: -0.1,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
  },

  shadows: {
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
    /** Bottom sheets / modals (alias of lg, stronger than md) */
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 12,
    },
  },
};
