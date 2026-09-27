import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react-native';
import { enterpriseColors as colors } from '../../../lib/enterprise-ui';

export default function StepInstructions({ onToggle, viewed }: { onToggle: () => void; viewed: boolean }) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.title}>{t('packingFlow.step1.title')}</Text>
      <Text style={styles.subtitle}>{t('packingFlow.step1.subtitle')}</Text>
      <View style={styles.list}>
        {[1, 2, 3, 4].map(number => (
          <View key={number} style={styles.row}>
            <Text style={styles.number}>{String(number).padStart(2, '0')}</Text>
            <Text style={styles.body}>{t(`packingFlow.step1.item${number}`)}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} style={styles.confirm}
        accessibilityRole="checkbox" accessibilityState={{ checked: viewed }}
        accessibilityLabel={t('packingFlow.step1.confirm')}>
        <View style={[styles.checkbox, viewed && styles.checked]}>
          {viewed ? <Check size={15} color={colors.white} /> : null}
        </View>
        <Text style={styles.confirmLabel}>{t('packingFlow.step1.confirm')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.gray900 },
  subtitle: { fontSize: 14, lineHeight: 20, color: colors.gray600, marginTop: 4, marginBottom: 16 },
  list: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  number: { fontSize: 12, lineHeight: 19, fontVariant: ['tabular-nums'], color: colors.gray600 },
  body: { flex: 1, fontSize: 13.5, lineHeight: 19, color: colors.gray900 },
  confirm: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 12, marginTop: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 1, borderColor: colors.gray600, alignItems: 'center', justifyContent: 'center' },
  checked: { borderColor: colors.primary, backgroundColor: colors.primary },
  confirmLabel: { flex: 1, fontSize: 14, lineHeight: 20, fontWeight: '500', color: colors.gray900 },
});
