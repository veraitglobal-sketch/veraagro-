/**
 * Shared Bio Vera “enterprise” surfaces — aligned with web (biovera.app):
 * white canvas, #2D5A27 primary, font-light heroes, gray-200 borders, rounded-lg CTAs.
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { theme } from './theme';

export const enterpriseColors = {
  primary: '#2D5A27',
  primaryHover: '#23471f',
  primaryTint: 'rgba(45, 90, 39, 0.08)',
  primaryTintStrong: 'rgba(45, 90, 39, 0.12)',
  canvas: '#f6f5f1',
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',
  border: '#e5e2db',
  tint: '#f7faf6',
  /** Signature tint — ONLY BioVeraProvenanceRibbon (do not reuse on lists/menus). */
  premiumTintBg: 'rgba(45, 90, 39, 0.05)',
  premiumTintBorder: 'rgba(45, 90, 39, 0.14)',
  /** Errors — text / icons only; never full red panels on tab roots. */
  destructive: '#991B1B',
  destructiveTint: 'rgba(153, 27, 27, 0.08)',
} as const;

/** Enterprise palette — no blue/amber status rainbows. */
export type EnterpriseValueTone = 'default' | 'primary' | 'muted' | 'pending';

export function enterpriseValueColor(tone: EnterpriseValueTone): string {
  switch (tone) {
    case 'primary':
      return enterpriseColors.primary;
    case 'pending':
      return enterpriseColors.gray700;
    case 'muted':
      return enterpriseColors.gray600;
    default:
      return enterpriseColors.gray900;
  }
}

export type EnterpriseLotBucket = 'here' | 'moving' | 'done';

export function enterpriseLotBucketStyle(bucket: EnterpriseLotBucket): { accent: string; tint: string } {
  switch (bucket) {
    case 'done':
      return { accent: enterpriseColors.gray700, tint: enterpriseColors.gray100 };
    case 'moving':
      return { accent: enterpriseColors.gray900, tint: enterpriseColors.gray100 };
    case 'here':
    default:
      return { accent: enterpriseColors.primary, tint: enterpriseColors.primaryTint };
  }
}

export function enterpriseEstateStatusColor(status: string): string {
  switch (status) {
    case 'CERTIFIED':
      return enterpriseColors.primary;
    case 'ACTIVE':
      return enterpriseColors.gray900;
    case 'PENDING_SETUP':
      return enterpriseColors.gray600;
    default:
      return enterpriseColors.gray600;
  }
}

export function enterpriseOrderStatusColor(status: string): string {
  switch (status) {
    case 'DELIVERED':
      return enterpriseColors.primary;
    case 'CANCELLED':
      return enterpriseColors.destructive;
    case 'PENDING':
      return enterpriseColors.gray600;
    case 'CONFIRMED':
    case 'PREPARING':
    case 'IN_TRANSIT':
      return enterpriseColors.gray900;
    default:
      return enterpriseColors.gray600;
  }
}

export const enterpriseUi = {
  screen: {
    flex: 1,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  heroTitle: {
    fontSize: 34,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.8,
    lineHeight: 42,
    textAlign: 'center',
  } as TextStyle,

  heroTitleAccent: {
    fontWeight: '400',
  } as TextStyle,

  heroLead: {
    fontSize: 16,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 24,
    textAlign: 'center',
    letterSpacing: -0.2,
  } as TextStyle,

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,

  /** In-app section titles — sentence case, private-banking tone. */
  inAppSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A67',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  } as TextStyle,

  inAppTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.6,
    lineHeight: 30,
  } as TextStyle,

  inAppLead: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: -0.1,
  } as TextStyle,

  /** Home-only trust ribbon — never use for nav/KPI/menus (premium = rare). */
  premiumSurface: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.premiumTintBorder,
    backgroundColor: enterpriseColors.premiumTintBg,
    overflow: 'hidden',
  } as ViewStyle,

  premiumIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: enterpriseColors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  premiumLead: {
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
    lineHeight: 20,
  } as TextStyle,

  premiumSub: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 18,
    letterSpacing: -0.05,
  } as TextStyle,

  kpiValue: {
    fontSize: 22,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  } as TextStyle,

  kpiLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.05,
    marginBottom: 6,
  } as TextStyle,

  /** White panel on canvas — warm border + soft elevation. */
  inAppPanel: {
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.09)',
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  } as ViewStyle,

  /** KPI / summary strip — tinted surface (not flat white). */
  kpiSurface: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: enterpriseColors.premiumTintBorder,
    backgroundColor: enterpriseColors.premiumTintBg,
    overflow: 'hidden',
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  } as ViewStyle,

  kpiAccentBar: {
    height: 3,
    width: '100%',
    backgroundColor: enterpriseColors.primary,
    opacity: 0.85,
  } as ViewStyle,

  navRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  kpiValueAccent: {
    fontSize: 22,
    fontWeight: '600',
    color: enterpriseColors.primary,
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.6,
  } as TextStyle,

  navRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 20,
  } as TextStyle,

  navRowSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    marginTop: 1,
    lineHeight: 17,
  } as TextStyle,

  navPanel: {
    width: '100%',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.09)',
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
  } as ViewStyle,

  card: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.09)',
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  } as ViewStyle,

  cardCurrent: {
    borderColor: enterpriseColors.primary,
    borderWidth: 1.5,
    backgroundColor: enterpriseColors.primaryTint,
  } as ViewStyle,

  cardDone: {
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.gray100,
  } as ViewStyle,

  buttonPrimary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,

  buttonPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.2,
  } as TextStyle,

  buttonOutline: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  } as ViewStyle,

  buttonOutlineText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.primary,
    letterSpacing: -0.2,
  } as TextStyle,

  /** Auth / welcome — web-like minimal surfaces */
  authCanvas: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  } as ViewStyle,

  authTaglineLine: {
    fontSize: 19,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.35,
    lineHeight: 26,
    textAlign: 'center',
  } as TextStyle,

  authTaglineAccent: {
    fontSize: 19,
    fontWeight: '400',
    color: enterpriseColors.primary,
    letterSpacing: -0.3,
    lineHeight: 26,
    textAlign: 'center',
  } as TextStyle,

  authRule: {
    width: 40,
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.gray200,
    alignSelf: 'center',
    marginBottom: 18,
  } as ViewStyle,

  /** Shared white panel (welcome CTAs + login form) */
  authPanel: {
    width: '100%',
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  } as ViewStyle,

  authPanelHeader: {
    alignItems: 'center',
    marginBottom: 22,
  } as ViewStyle,

  authTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: 6,
  } as TextStyle,

  authSubtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  } as TextStyle,

  authLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray700,
    letterSpacing: -0.15,
    marginBottom: 6,
  } as TextStyle,

  authHint: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginBottom: 6,
  } as TextStyle,

  authInput: {
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 12,
    backgroundColor: enterpriseColors.white,
    minHeight: 48,
  } as ViewStyle,

  authInputFocused: {
    borderColor: enterpriseColors.primary,
    borderWidth: 2,
  } as ViewStyle,

  authFieldGap: {
    marginTop: 16,
  } as ViewStyle,

  authSubmit: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 22,
  } as ViewStyle,

  authSubmitText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.25,
  } as TextStyle,

  authBtnPrimary: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    shadowColor: '#1F3D1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  } as ViewStyle,

  authBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.25,
  } as TextStyle,

  authBtnSecondary: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: enterpriseColors.gray100,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 14,
    paddingVertical: 12,
    gap: 12,
  } as ViewStyle,

  authBtnSecondaryText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
    lineHeight: 20,
  } as TextStyle,

  authChevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: enterpriseColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: enterpriseColors.gray200,
    overflow: 'hidden',
  } as ViewStyle,

  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: enterpriseColors.primary,
  } as ViewStyle,

  /** Bottom tabs — white bar, readable labels (farmers 60+). */
  tabBar: {
    backgroundColor: enterpriseColors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  } as ViewStyle,

  tabBarLabel: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.15,
    marginTop: 2,
  } as TextStyle,

  /** Hub / settings row — large tap target, one-line helper max. */
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.09)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 64,
    marginBottom: 8,
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  } as ViewStyle,

  listRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  } as ViewStyle,

  listRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 20,
  } as TextStyle,

  listRowDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 17,
  } as TextStyle,

  screenTopWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  } as ViewStyle,
};

/** Shared Expo Router tab options — static; custom GrowerTabBar handles insets. */
export const growerTabScreenOptions = {
  tabBarActiveTintColor: enterpriseColors.primary,
  tabBarInactiveTintColor: enterpriseColors.gray600,
  tabBarStyle: {
    position: 'absolute' as const,
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    elevation: 0,
    /** Custom floating pill — prevent layout slot from re-measuring and looping updates. */
    height: 0,
  },
  tabBarLabelStyle: enterpriseUi.tabBarLabel,
  tabBarIconStyle: { marginTop: 0 },
  headerShown: false,
} as const;

export const enterpriseStyles = StyleSheet.create({
  logo: {
    width: 140,
    height: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconWrapDone: {
    backgroundColor: theme.colors.successLight,
  },
  stepAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: enterpriseColors.primary,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.lg,
  },
});
