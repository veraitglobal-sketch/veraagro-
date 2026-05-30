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
    paddingHorizontal: 20,
    paddingTop: 16,
    flexGrow: 0,
  } as ViewStyle,

  /** Tab roots: stretch content to bottom safe area (no half-empty canvas). */
  tabRootBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  } as ViewStyle,

  pageTitle: {
    fontSize: 26,
    fontWeight: '400',
    color: enterpriseColors.gray900,
    letterSpacing: -0.55,
    lineHeight: 32,
  } as TextStyle,

  pageLead: {
    fontSize: 16,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 23,
    marginTop: 8,
    letterSpacing: -0.15,
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
    width: 48,
    height: 48,
    borderRadius: 12,
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
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 6,
  } as TextStyle,

  formInput: {
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
    marginBottom: 16,
  } as TextStyle,

  formPanel: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 18,
    marginBottom: 12,
  } as ViewStyle,

  settingsGroupTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  } as TextStyle,

  settingsRowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
  } as TextStyle,

  settingsRowDesc: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 4,
    lineHeight: 21,
  } as TextStyle,

  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  filterChipOn: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  } as ViewStyle,

  filterChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray600,
  } as TextStyle,

  filterChipTextOn: {
    color: enterpriseColors.primary,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
