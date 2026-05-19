/**
 * Compliance photos — enterprise tokens (aligned with grower UI).
 */
import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { enterpriseColors, enterpriseUi } from './enterprise-ui';
import { growerUi } from './grower-ui';

export const complianceUi = {
  heading: enterpriseUi.inAppSectionLabel,
  body: enterpriseUi.inAppLead,
  link: {
    color: enterpriseColors.primary,
    fontWeight: '600' as const,
  } as TextStyle,

  panel: {
    ...enterpriseUi.authPanel,
    marginBottom: 16,
  } as ViewStyle,

  panelTitle: {
    ...enterpriseUi.navRowTitle,
    marginBottom: 8,
  } as TextStyle,

  bullet: {
    fontSize: 15,
    color: enterpriseColors.gray600,
    lineHeight: 22,
    marginBottom: 6,
  } as TextStyle,

  successPanel: {
    ...enterpriseUi.inAppPanel,
    borderColor: enterpriseColors.premiumTintBorder,
    backgroundColor: enterpriseColors.premiumTintBg,
    padding: 18,
    marginBottom: 16,
  } as ViewStyle,

  warnText: {
    fontSize: 15,
    color: enterpriseColors.gray700,
    lineHeight: 22,
  } as TextStyle,

  input: growerUi.formInput,

  verifyBtn: {
    ...enterpriseUi.authBtnPrimary,
    minHeight: 52,
    paddingHorizontal: 18,
  } as ViewStyle,

  verifyBtnText: enterpriseUi.authBtnPrimaryText,

  photoBox: {
    minHeight: 180,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: enterpriseColors.gray200,
    borderRadius: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: enterpriseColors.white,
    overflow: 'hidden' as const,
    marginBottom: 16,
  } as ViewStyle,

  saveBtn: enterpriseUi.authBtnPrimary,
  saveBtnText: enterpriseUi.authBtnPrimaryText,
};

export const complianceStyles = StyleSheet.create({
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'stretch',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerPanel: {
    ...enterpriseUi.inAppPanel,
    maxHeight: 200,
    marginTop: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  pickerRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
});
