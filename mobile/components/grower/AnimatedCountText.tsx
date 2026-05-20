import { Text, type TextStyle, type StyleProp } from 'react-native';

type Props = {
  value: number;
  style?: StyleProp<TextStyle>;
  /** @deprecated Animation disabled — value shown immediately */
  stepMs?: number;
  /** @deprecated Animation disabled — value shown immediately */
  animate?: boolean;
};

function formatCount(value: number): number {
  return Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
}

/** KPI number — static display (no 0→1→2 counting). */
export function AnimatedCountText({ value, style }: Props) {
  return <Text style={style}>{formatCount(value)}</Text>;
}
