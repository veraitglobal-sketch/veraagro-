import { View, Text } from 'react-native';
import { theme } from '../lib/theme';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

/**
 * Step Indicator Component
 * Minimalist step indicator with thin lines
 */
export default function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 20 }}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step <= currentStep;
        const isCurrent = step === currentStep;

        return (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            {/* Step Circle */}
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                borderWidth: isActive ? 0 : 0.5,
                borderColor: theme.colors.border,
                backgroundColor: isActive ? theme.colors.primary : theme.colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              {isActive ? (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: theme.colors.background,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.text.tertiary,
                  }}
                />
              )}
            </View>

            {/* Step Label */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: '400',
                color: isActive ? theme.colors.text.primary : theme.colors.text.secondary,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}
            >
              {labels[index] || `Step ${step}`}
            </Text>

            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <View
                style={{
                  position: 'absolute',
                  top: 16,
                  left: '50%',
                  width: '100%',
                  height: 0.5,
                  backgroundColor: step < currentStep ? theme.colors.primary : theme.colors.border,
                  zIndex: -1,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}
