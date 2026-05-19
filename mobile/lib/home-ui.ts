/**
 * Grower home — aligned with web GrowerPageShell / workflow cards.
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { enterpriseColors, enterpriseUi } from './enterprise-ui';

export const homeUi = {
  sectionGap: {
    marginBottom: 20,
  } as ViewStyle,

  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.3,
    marginBottom: 6,
  } as TextStyle,

  sectionHint: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 22,
    marginBottom: 14,
    letterSpacing: -0.15,
  } as TextStyle,

  surfaceCard: {
    ...enterpriseUi.card,
    padding: 18,
    marginBottom: 16,
  } as ViewStyle,

  heroBand: {
    backgroundColor: enterpriseColors.white,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    paddingHorizontal: 20,
    paddingBottom: 16,
  } as ViewStyle,

  heroFarmName: {
    fontSize: 26,
    fontWeight: '300',
    color: enterpriseColors.gray900,
    letterSpacing: -0.6,
    lineHeight: 32,
  } as TextStyle,

  heroLead: {
    fontSize: 15,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    lineHeight: 22,
    marginTop: 6,
    letterSpacing: -0.15,
  } as TextStyle,

  heroMeta: {
    fontSize: 13,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 8,
  } as TextStyle,

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  } as ViewStyle,

  statCell: {
    flex: 1,
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 76,
    justifyContent: 'space-between',
  } as ViewStyle,

  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    letterSpacing: -0.1,
  } as TextStyle,

  statValue: {
    fontSize: 28,
    fontWeight: '300',
    color: enterpriseColors.gray900,
    letterSpacing: -0.8,
    marginTop: 6,
  } as TextStyle,

  journeyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: 'rgba(249, 250, 251, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  } as ViewStyle,

  journeyRowCurrent: {
    borderColor: '#FCD34D',
    backgroundColor: 'rgba(254, 243, 199, 0.45)',
  } as ViewStyle,

  workflowRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: enterpriseColors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    minHeight: 72,
  } as ViewStyle,

  workflowIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primaryTint,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  workflowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 21,
  } as TextStyle,

  workflowDesc: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 4,
    lineHeight: 20,
  } as TextStyle,

  logisticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.14)',
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    minHeight: 52,
  } as ViewStyle,

  logisticsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
  } as TextStyle,

  alsoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  } as TextStyle,

  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: enterpriseColors.primary,
  } as ViewStyle,

  card: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  } as ViewStyle,

  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: enterpriseColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    marginTop: 14,
  } as ViewStyle,

  primaryCtaText: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.25,
  } as TextStyle,

  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    minHeight: 56,
  } as ViewStyle,

  linkRowTinted: {
    backgroundColor: enterpriseColors.primaryTint,
    borderColor: 'rgba(45, 90, 39, 0.18)',
  } as ViewStyle,

  linkTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
  } as TextStyle,

  linkSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 3,
    lineHeight: 17,
  } as TextStyle,
};

export const homeStyles = StyleSheet.create({
  linkIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
    minWidth: 0,
  },
});
