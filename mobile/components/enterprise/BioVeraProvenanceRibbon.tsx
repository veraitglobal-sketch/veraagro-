import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

/** Home trust strip — defines premium surface language for the grower app. */
export function BioVeraProvenanceRibbon() {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap} accessibilityRole="text">
      <View style={enterpriseUi.premiumIconCircle}>
        <ShieldCheck size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
      </View>
      <View style={styles.copy}>
        <Text style={enterpriseUi.premiumLead}>{t('producer.brand.ribbon')}</Text>
        <Text style={[enterpriseUi.premiumSub, styles.subGap]}>{t('producer.brand.ribbonSub')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...enterpriseUi.premiumSurface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  subGap: {
    marginTop: 3,
  },
});
