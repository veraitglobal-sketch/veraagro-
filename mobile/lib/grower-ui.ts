/**
 * Grower screens — same tokens as welcome / home (#2D5A27, gray-50, white cards).
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { enterpriseColors, enterpriseUi } from './enterprise-ui';

export const growerUi = {
  canvas: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  } as ViewStyle,

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 0,
  } as ViewStyle,

  /** Tab roots: stretch content to bottom safe area (no half-empty canvas). */
  tabRootBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  } as ViewStyle,

  pageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.6,
    lineHeight: 30,
  } as TextStyle,

  pageLead: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: -0.1,
  } as TextStyle,

  sectionLabel: {
    ...enterpriseUi.inAppSectionLabel,
    marginTop: 4,
    marginBottom: 10,
  } as TextStyle,

  card: {
    ...enterpriseUi.inAppPanel,
    marginBottom: 10,
  } as ViewStyle,

  metricsCard: {
    ...enterpriseUi.inAppPanel,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  } as ViewStyle,

  tile: enterpriseUi.listRow,
  tileIcon: enterpriseUi.listRowIcon,
  tileTitle: enterpriseUi.listRowTitle,
  tileDesc: enterpriseUi.listRowDesc,

  btnPrimary: enterpriseUi.authBtnPrimary,
  btnPrimaryText: enterpriseUi.authBtnPrimaryText,

  btnIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  emptyCard: {
    ...enterpriseUi.authPanel,
    alignItems: 'center',
    paddingVertical: 28,
    marginTop: 8,
  } as ViewStyle,

  estateCard: {
    ...enterpriseUi.inAppPanel,
    padding: 16,
    marginBottom: 10,
  } as ViewStyle,

  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A67',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 6,
  } as TextStyle,

  formInput: {
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
    marginBottom: 14,
  } as TextStyle,

  formPanel: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.09)',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 1,
  } as ViewStyle,

  settingsGroupTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A67',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  } as TextStyle,

  settingsRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
  } as TextStyle,

  settingsRowDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 2,
    lineHeight: 18,
  } as TextStyle,

  filterChip: {
    paddingHorizontal: 14,
    height: 34,
    justifyContent: 'center',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  filterChipOn: {
    borderColor: '#1F3D1B',
    backgroundColor: '#1F3D1B',
  } as ViewStyle,

  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray700,
    letterSpacing: -0.15,
  } as TextStyle,

  filterChipTextOn: {
    color: enterpriseColors.white,
  } as TextStyle,
};

export const growerStyles = StyleSheet.create({
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: enterpriseColors.canvas,
  },
  headerAccent: {
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: enterpriseColors.primary,
    marginBottom: 14,
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: enterpriseColors.gray600,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    fontVariant: ['tabular-nums'],
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
