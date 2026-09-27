import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { enterpriseColors as colors } from '../../lib/enterprise-ui';

/** Read-only progress; navigation remains with validated form actions. */
export function WorkflowSteps({ labels, current }: { labels: string[]; current: number }) {
  return (
    <View style={styles.row}>
      {labels.map((label, index) => (
        <View key={label} style={styles.step} accessible accessibilityLabel={`${index + 1}/${labels.length}: ${label}`} accessibilityState={{ selected: index === current }}>
          <View style={[styles.marker, index <= current && styles.activeMarker]}>
            {index < current ? <Check size={12} color={colors.white} /> : (
              <Text style={[styles.number, index === current && styles.activeNumber]}>{index + 1}</Text>
            )}
          </View>
          <Text style={[styles.label, index === current && styles.activeLabel]}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  step: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  marker: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.gray200, alignItems: 'center', justifyContent: 'center' },
  activeMarker: { backgroundColor: colors.primary },
  number: { fontSize: 11, fontWeight: '600', color: colors.gray600 },
  activeNumber: { color: colors.white },
  label: { flex: 1, fontSize: 12, lineHeight: 16, color: colors.gray600 },
  activeLabel: { color: colors.primary, fontWeight: '600' },
});
