import { TouchableOpacity, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react-native';
import { dsColors } from './theme';

/** Round back control shared by every stack/subpage header. */
export function BackButton({ onPress, style }: { onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.6}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={t('common.back')}
      style={[styles.back, style]}
    >
      <ChevronLeft size={20} color={dsColors.gray900} strokeWidth={2} style={{ marginLeft: -2 }} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: dsColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.12)',
    shadowColor: '#1a3328',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
