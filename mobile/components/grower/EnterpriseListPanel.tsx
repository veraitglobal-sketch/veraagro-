import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { enterpriseColors } from '../../lib/enterprise-ui';

export type EnterpriseListItem = {
  key: string;
  label: string;
  onPress: () => void;
};

/**
 * Minimal grouped list — one white surface, hairline dividers, no icon tiles.
 */
export function EnterpriseListPanel({ items }: { items: EnterpriseListItem[] }) {
  return (
    <View style={styles.panel}>
      {items.map((item, index) => (
        <TouchableOpacity
          key={item.key}
          onPress={item.onPress}
          activeOpacity={0.65}
          style={[styles.row, index < items.length - 1 && styles.rowBorder]}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={styles.label}>{item.label}</Text>
          <ChevronRight size={18} color={enterpriseColors.gray600} strokeWidth={1.5} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: enterpriseColors.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: enterpriseColors.gray200,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    minHeight: 56,
    paddingVertical: 16,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
  },
});
