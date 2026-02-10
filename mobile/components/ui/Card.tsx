import { View, ViewProps } from 'react-native';
import { theme } from '../../lib/theme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export default function Card({ 
  children, 
  variant = 'default', 
  padding = 'md',
  className = '',
  style,
  ...props 
}: CardProps) {
  const paddingMap = {
    none: 0,
    sm: theme.spacing.sm,
    md: theme.spacing.md,
    lg: theme.spacing.lg,
    xl: theme.spacing.xl,
  };

  const variantStyles = {
    default: {
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 0,
      borderColor: 'transparent',
    },
    elevated: {
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 0,
      borderColor: 'transparent',
      ...theme.shadows.md,
    },
    outlined: {
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
  };

  const resolvedStyle = style && typeof style === 'object' ? style : {};
  return (
    <View
      className={`rounded-${theme.borderRadius.lg} ${className}`}
      style={{
        padding: paddingMap[padding],
        ...variantStyles[variant],
        ...resolvedStyle,
      }}
      {...props}
    >
      {children}
    </View>
  );
}
