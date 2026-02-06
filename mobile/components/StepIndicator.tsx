import { View, Text } from 'react-native';
import { colors } from '../lib/colors';

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
                borderColor: colors.border,
                backgroundColor: isActive ? colors.primary : colors.background,
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
                    backgroundColor: colors.background,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.text.tertiary,
                  }}
                />
              )}
            </View>

            {/* Step Label */}
            <Text
              style={{
                fontSize: 10,
                fontWeight: '300',
                color: isActive ? colors.text.primary : colors.text.secondary,
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
                  backgroundColor: step < currentStep ? colors.primary : colors.border,
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
