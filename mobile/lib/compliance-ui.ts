/**
 * Compliance photos screen — enterprise tokens (farmer-readable sizes).
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { enterpriseColors, enterpriseUi } from './enterprise-ui';
import { growerUi } from './grower-ui';

export const complianceUi = {
  canvas: {
    flex: 1,
    backgroundColor: enterpriseColors.canvas,
  } as ViewStyle,

  scrollPad: {
    paddingTop: 12,
    paddingBottom: 32,
  } as ViewStyle,

  heading: {
    fontSize: 18,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.3,
    marginBottom: 10,
  } as TextStyle,

  body: {
    fontSize: 16,
    color: enterpriseColors.gray600,
    lineHeight: 23,
    marginBottom: 16,
  } as TextStyle,

  link: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  } as TextStyle,

  panel: {
    ...enterpriseUi.authPanel,
    marginBottom: 20,
  } as ViewStyle,

  panelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    marginBottom: 8,
  } as TextStyle,

  bullet: {
    fontSize: 15,
    color: enterpriseColors.gray600,
    lineHeight: 22,
    marginBottom: 6,
  } as TextStyle,

  successPanel: {
    backgroundColor: enterpriseColors.primaryTint,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.25)',
    padding: 18,
    marginBottom: 20,
  } as ViewStyle,

  warnText: {
    fontSize: 15,
    color: '#92400E',
    lineHeight: 22,
  } as TextStyle,

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  } as ViewStyle,

  chipOn: {
    borderColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  } as ViewStyle,

  chipText: {
    fontSize: 15,
    color: enterpriseColors.gray600,
  } as TextStyle,

  chipTextOn: {
    color: enterpriseColors.primary,
    fontWeight: '600',
  } as TextStyle,

  input: {
    borderWidth: 1,
    borderColor: enterpriseColors.gray200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
  } as TextStyle,

  verifyBtn: {
    minHeight: 52,
    paddingHorizontal: 18,
    justifyContent: 'center',
    backgroundColor: enterpriseColors.primary,
    borderRadius: 12,
  } as ViewStyle,

  verifyBtnText: {
    color: enterpriseColors.white,
    fontWeight: '600',
    fontSize: 16,
  } as TextStyle,

  photoBox: {
    minHeight: 180,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: enterpriseColors.gray200,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden',
    marginBottom: 20,
  } as ViewStyle,

  saveBtn: growerUi.btnPrimary,
  saveBtnText: growerUi.btnPrimaryText,
};

export const complianceStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
