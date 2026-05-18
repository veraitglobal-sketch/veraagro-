/**
 * Grower home — enterprise cards on gray-50, Vera green accents.
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { enterpriseColors } from './enterprise-ui';
import { theme } from './theme';

export const homeUi = {
  canvas: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  } as ViewStyle,

  heroBand: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 4,
  } as TextStyle,

  farmName: {
    fontSize: 26,
    fontWeight: '300',
    color: enterpriseColors.gray900,
    letterSpacing: -0.6,
    lineHeight: 32,
  } as TextStyle,

  farmMeta: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 6,
    letterSpacing: -0.1,
  } as TextStyle,

  taglineChip: {
    alignSelf: 'flex-start',
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: enterpriseColors.primaryTint,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.14)',
  } as ViewStyle,

  taglineChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: enterpriseColors.primary,
    letterSpacing: -0.15,
  } as TextStyle,

  content: {
    paddingTop: 16,
  } as ViewStyle,

  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.55,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  } as TextStyle,

  card: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    overflow: 'hidden',
  } as ViewStyle,

  cardBody: {
    padding: 16,
  } as ViewStyle,

  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: enterpriseColors.primary,
  } as ViewStyle,

  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  } as ViewStyle,

  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  statPillAccent: {
    borderColor: 'rgba(45, 90, 39, 0.22)',
    backgroundColor: enterpriseColors.primaryTint,
  } as ViewStyle,

  statPillValue: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.4,
  } as TextStyle,

  statPillValueAccent: {
    color: enterpriseColors.primary,
  } as TextStyle,

  statPillLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginTop: 2,
    letterSpacing: 0.2,
  } as TextStyle,

  quickGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  } as ViewStyle,

  quickTile: {
    flex: 1,
    minHeight: 88,
    backgroundColor: enterpriseColors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    padding: 12,
    justifyContent: 'space-between',
  } as ViewStyle,

  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  quickLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.2,
    lineHeight: 17,
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

  primaryCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: enterpriseColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    marginTop: 4,
  } as ViewStyle,

  primaryCtaText: {
    fontSize: 15,
    fontWeight: '600',
    color: enterpriseColors.white,
    letterSpacing: -0.2,
    flex: 1,
  } as TextStyle,
};

export const homeStyles = StyleSheet.create({
  linkIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: enterpriseColors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
    minWidth: 0,
  },
});
