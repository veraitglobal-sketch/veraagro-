import type { ComponentType, ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { enterpriseColors } from '../lib/enterprise-ui';
import { growerSheet, growerSheetCardStyle } from './grower-sheet-styles';

type IconProps = { size?: number; color?: string; strokeWidth?: number };

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon?: ComponentType<IconProps>;
  onPress?: () => void;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  trailing?: ReactNode;
};

/** Stat row inside white sheet — premium card with soft shadow. */
export function GrowerSheetStatCard({
  label,
  value,
  hint,
  icon: Icon,
  onPress,
  loading = false,
  style,
  trailing,
}: Props) {
  const inner = (
    <>
      {Icon ? (
        <LinearGradient
          colors={['rgba(45, 90, 39, 0.14)', 'rgba(45, 90, 39, 0.06)']}
          style={styles.iconBox}
        >
          <Icon size={26} color={enterpriseColors.primary} strokeWidth={1.5} />
        </LinearGradient>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {loading ? (
          <ActivityIndicator size="small" color={enterpriseColors.primary} style={styles.loader} />
        ) : (
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {value}
          </Text>
        )}
        {hint ? (
          <Text style={styles.hint} numberOfLines={2}>
            {hint}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <ChevronRight size={20} color={enterpriseColors.gray600} strokeWidth={1.5} /> : null}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.82}
        accessibilityRole="button"
        style={[styles.card, style]}
      >
        {inner}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.card, style]}>{inner}</View>;
}

const styles = StyleSheet.create({
  card: {
    ...growerSheetCardStyle(),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    paddingHorizontal: 18,
    marginBottom: 14,
    minHeight: 102,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: growerSheet.radiusIcon,
    borderWidth: 1,
    borderColor: growerSheet.iconBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: enterpriseColors.gray600,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: {
    fontSize: 28,
    fontWeight: '500',
    color: growerSheet.title,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  hint: {
    fontSize: 14,
    fontWeight: '400',
    color: enterpriseColors.gray600,
    marginTop: 5,
    lineHeight: 19,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 4,
  },
});
