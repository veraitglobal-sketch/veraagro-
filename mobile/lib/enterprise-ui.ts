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
  canvas: '#F9FAFB',
  gray900: '#111827',
  gray700: '#374151',
  gray600: '#4B5563',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  white: '#FFFFFF',
} as const;

export const enterpriseUi = {
  screen: {
    flex: 1,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  heroTitle: {
    fontSize: 34,
    fontWeight: '300',
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
    fontSize: 12,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  } as TextStyle,

  card: {
    backgroundColor: enterpriseColors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    ...theme.shadows.sm,
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
    borderRadius: theme.borderRadius.lg,
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
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
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
    fontWeight: '300',
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
    fontWeight: '300',
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
    fontSize: 12,
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
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  } as ViewStyle,

  authBtnPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.25,
  } as TextStyle,

  authBtnSecondary: {
    minHeight: 52,
    borderRadius: 12,
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
};

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
