import { TouchableOpacity, Text, ActivityIndicator, View, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../../lib/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  className = '',
}: ButtonProps) {
  const sizeStyles = {
    sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 14 },
    md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 16 },
    lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 18 },
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.text.inverse,
    },
    secondary: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      textColor: theme.colors.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.primary,
      textColor: theme.colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.primary,
    },
    danger: {
      backgroundColor: theme.colors.error,
      borderWidth: 0,
      borderColor: 'transparent',
      textColor: theme.colors.text.inverse,
    },
  };

  const currentStyle = variantStyles[variant];
  const currentSize = sizeStyles[size];
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={{
        paddingVertical: currentSize.paddingVertical,
        paddingHorizontal: currentSize.paddingHorizontal,
        backgroundColor: currentStyle.backgroundColor,
        borderWidth: currentStyle.borderWidth,
        borderColor: currentStyle.borderColor,
        borderRadius: theme.borderRadius.lg,
        opacity,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        width: fullWidth ? '100%' : undefined,
        ...(variant === 'primary' ? theme.shadows.sm : {}),
      }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={currentStyle.textColor} 
        />
      ) : (
        <>
          {icon && <View style={{ marginRight: theme.spacing.xs }}>{icon}</View>}
          <Text
            style={{
              color: currentStyle.textColor,
              fontSize: currentSize.fontSize,
              fontWeight: '500',
              letterSpacing: -0.2,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
