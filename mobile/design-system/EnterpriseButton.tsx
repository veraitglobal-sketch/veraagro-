import type { ReactNode } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  buttonContainerStyle,
  buttonHeight,
  dsColors,
  dsTypography,
} from './theme';

export type EnterpriseButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type EnterpriseButtonSize = 'default' | 'large' | 'farmer';

type Props = {
  label: string;
  onPress: () => void;
  variant?: EnterpriseButtonVariant;
  size?: EnterpriseButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

function labelStyle(variant: EnterpriseButtonVariant) {
  switch (variant) {
    case 'primary':
      return dsTypography.buttonPrimaryText;
    case 'secondary':
      return dsTypography.buttonSecondaryText;
    case 'outline':
      return dsTypography.buttonOutlineText;
    case 'danger':
      return dsTypography.buttonDangerText;
    case 'ghost':
      return dsTypography.buttonOutlineText;
    default:
      return dsTypography.buttonPrimaryText;
  }
}

export function EnterpriseButton({
  label,
  onPress,
  variant = 'primary',
  size = 'default',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  style,
  accessibilityLabel,
}: Props) {
  const isDisabled = disabled || loading;
  const spinnerColor =
    variant === 'primary' ? dsColors.white : dsColors.primary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        buttonContainerStyle(variant, size),
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={spinnerColor} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text style={labelStyle(variant)}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export { buttonHeight as enterpriseButtonHeight };
