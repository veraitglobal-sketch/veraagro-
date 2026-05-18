import { Text, type TextStyle, type StyleProp } from 'react-native';
import { useAnimatedCount } from '../../hooks/useAnimatedCount';

type Props = {
  value: number;
  style?: StyleProp<TextStyle>;
  stepMs?: number;
  animate?: boolean;
};

export function AnimatedCountText({ value, style, stepMs, animate }: Props) {
  const display = useAnimatedCount(value, { stepMs, animate });
  return <Text style={style}>{display}</Text>;
}
