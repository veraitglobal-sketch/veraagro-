import { View, Text } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { theme } from '../lib/theme';

interface TrustScoreWidgetProps {
  score: number; // 0-100
  size?: number;
}

export default function TrustScoreWidget({ score, size = 120 }: TrustScoreWidgetProps) {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const center = size / 2;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return theme.colors.success;
    if (score >= 60) return theme.colors.warning;
    return theme.colors.error;
  };

  return (
    <View className="items-center">
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={theme.colors.border}
          strokeWidth={2}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={getColor()}
          strokeWidth={3}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        {/* Score text */}
        <SvgText
          x={center}
          y={center - 8}
          fontSize={24}
          fontWeight="normal"
          fill={theme.colors.text.primary}
          textAnchor="middle"
        >
          {score}
        </SvgText>
        <SvgText
          x={center}
          y={center + 12}
          fontSize={13}
          fill={theme.colors.text.secondary}
          textAnchor="middle"
        >
          Trust Score
        </SvgText>
      </Svg>
    </View>
  );
}
