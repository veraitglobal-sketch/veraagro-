import { StyleSheet, type TextStyle, type ViewStyle } from 'react-native';
import { vera } from '../lib/design-tokens';

export const ds = vera;

export const dsColors = {
  primary: ds.color.primary,
  primaryHover: ds.color.primaryHover,
  canvas: ds.color.canvas,
  surface: ds.color.surface,
  border: ds.color.border,
  borderNeutral: ds.color.borderNeutral,
  tint: ds.color.tint,
  muted: ds.color.muted,
  foreground: ds.color.foreground,
  gray900: ds.color.gray900,
  gray700: ds.color.gray700,
  gray600: ds.color.gray600,
  gray200: ds.color.gray200,
  gray100: ds.color.gray100,
  white: ds.color.surface,
  destructive: ds.color.destructive,
  destructiveBorder: ds.color.destructiveBorder,
  destructiveText: ds.color.destructiveText,
  primaryTint: ds.color.primaryTint,
  premiumTintBg: ds.color.premiumTintBg,
  premiumTintBorder: ds.color.premiumTintBorder,
  secondaryBorder: ds.color.secondaryBorder,
} as const;

export const dsStyles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: dsColors.canvas,
  },
  heroRoot: {
    flex: 1,
    backgroundColor: '#1a3d28',
  },
  screenTopWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  panel: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.07)',
    backgroundColor: dsColors.surface,
    overflow: 'hidden',
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  panelPaddingMd: {
    padding: 18,
  },
  panelPaddingLg: {
    padding: 20,
  },
  accentPanel: {
    width: '100%',
    borderRadius: ds.radius.lg,
    borderWidth: 1,
    borderColor: dsColors.premiumTintBorder,
    backgroundColor: dsColors.premiumTintBg,
    overflow: 'hidden',
  },
  navRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: dsColors.primaryTint,
    borderWidth: 1,
    borderColor: dsColors.premiumTintBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    paddingVertical: 16,
    paddingHorizontal: 18,
    gap: 14,
  },
  navRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: dsColors.borderNeutral,
  },
  navRowBorderGlass: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255, 255, 255, 0.32)',
  },
});

export const dsTypography = {
  eyebrow: {
    fontSize: ds.type.eyebrow,
    fontWeight: ds.type.weight.semibold,
    color: dsColors.primary,
    letterSpacing: 2,
    textTransform: 'uppercase',
  } as TextStyle,
  pageTitle: {
    fontSize: 24,
    fontWeight: ds.type.weight.semibold,
    color: '#1a3328',
    letterSpacing: -0.6,
    lineHeight: 30,
  } as TextStyle,
  pageLead: {
    fontSize: 14,
    fontWeight: ds.type.weight.regular,
    color: dsColors.muted,
    lineHeight: 20,
    marginTop: 6,
    letterSpacing: -0.12,
  } as TextStyle,
  statusLine: {
    fontSize: ds.type.body,
    fontWeight: ds.type.weight.regular,
    color: dsColors.muted,
    lineHeight: 22,
    marginTop: 10,
  } as TextStyle,
  sectionLabel: {
    fontSize: 12,
    fontWeight: ds.type.weight.semibold,
    color: '#6B7A67',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  } as TextStyle,
  navRowTitle: {
    fontSize: ds.type.sectionTitle,
    fontWeight: ds.type.weight.medium,
    color: dsColors.gray900,
    letterSpacing: -0.28,
    lineHeight: 22,
  } as TextStyle,
  navRowSubtitle: {
    fontSize: 14,
    fontWeight: ds.type.weight.regular,
    color: dsColors.muted,
    marginTop: 3,
    lineHeight: 19,
  } as TextStyle,
  fieldLabel: {
    fontSize: 14,
    fontWeight: ds.type.weight.medium,
    color: dsColors.gray700,
    letterSpacing: -0.15,
    marginBottom: 6,
  } as TextStyle,
  fieldHint: {
    fontSize: ds.type.caption,
    fontWeight: ds.type.weight.regular,
    color: dsColors.muted,
    marginTop: 6,
    lineHeight: 18,
  } as TextStyle,
  fieldError: {
    fontSize: ds.type.caption,
    fontWeight: ds.type.weight.regular,
    color: dsColors.destructive,
    marginTop: 6,
    lineHeight: 18,
  } as TextStyle,
  buttonPrimaryText: {
    fontSize: ds.type.body,
    fontWeight: ds.type.weight.semibold,
    color: dsColors.white,
    letterSpacing: -0.2,
  } as TextStyle,
  buttonSecondaryText: {
    fontSize: ds.type.body,
    fontWeight: ds.type.weight.medium,
    color: dsColors.gray900,
    letterSpacing: -0.2,
  } as TextStyle,
  buttonOutlineText: {
    fontSize: ds.type.body,
    fontWeight: ds.type.weight.semibold,
    color: dsColors.primary,
    letterSpacing: -0.2,
  } as TextStyle,
  buttonDangerText: {
    fontSize: ds.type.bodyLarge,
    fontWeight: ds.type.weight.semibold,
    color: dsColors.destructiveText,
  } as TextStyle,
} as const;

export function buttonHeight(size: 'default' | 'large' | 'farmer'): number {
  switch (size) {
    case 'farmer':
      return ds.touch.farmer;
    case 'large':
      return ds.touch.large;
    default:
      return ds.touch.cta;
  }
}

export function inputHeight(size: 'default' | 'farmer'): number {
  return size === 'farmer' ? ds.touch.farmer : ds.touch.cta;
}

export function buttonContainerStyle(
  variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger',
  size: 'default' | 'large' | 'farmer',
): ViewStyle {
  const h = buttonHeight(size);
  const base: ViewStyle = {
    minHeight: h,
    borderRadius: ds.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  };
  switch (variant) {
    case 'primary':
      return { ...base, backgroundColor: dsColors.primary };
    case 'secondary':
      return {
        ...base,
        backgroundColor: dsColors.surface,
        borderWidth: 1,
        borderColor: dsColors.secondaryBorder,
      };
    case 'outline':
      return {
        ...base,
        backgroundColor: dsColors.surface,
        borderWidth: 2,
        borderColor: dsColors.primary,
      };
    case 'ghost':
      return { ...base, backgroundColor: 'transparent' };
    case 'danger':
      return {
        ...base,
        backgroundColor: dsColors.surface,
        borderWidth: 1,
        borderColor: dsColors.destructiveBorder,
      };
    default:
      return base;
  }
}

export function inputContainerStyle(focused: boolean, hasError: boolean): ViewStyle {
  return {
    borderWidth: focused || hasError ? 2 : 1,
    borderColor: hasError ? dsColors.destructiveBorder : focused ? dsColors.primary : 'rgba(17, 24, 39, 0.12)',
    borderRadius: ds.radius.md,
    backgroundColor: dsColors.surface,
    minHeight: ds.touch.cta,
    paddingHorizontal: 14,
    justifyContent: 'center',
  };
}
