import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  className?: string;
}

export default function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-green-200',
  };

  return (
    <View
      className={`rounded-xl p-4 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
