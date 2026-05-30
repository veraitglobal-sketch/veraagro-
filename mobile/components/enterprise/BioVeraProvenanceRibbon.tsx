import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react-native';
import { GlassSurface } from '../../design-system/GlassSurface';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';

/** Home trust strip — defines premium surface language for the grower app. */
export function BioVeraProvenanceRibbon({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();

  return (
    <GlassSurface style={[styles.wrap, compact && styles.wrapCompact]} contentStyle={styles.inner} blur={38}>
      <View style={enterpriseUi.premiumIconCircle}>
        <ShieldCheck size={16} color={enterpriseColors.primary} strokeWidth={1.5} />
      </View>
      <View style={styles.copy}>
        <Text style={enterpriseUi.premiumLead}>{t('producer.brand.ribbon')}</Text>
        <Text style={[enterpriseUi.premiumSub, styles.subGap]}>{t('producer.brand.ribbonSub')}</Text>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginBottom: 18,
  },
  wrapCompact: {
    marginHorizontal: 0,
    marginBottom: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  subGap: {
    marginTop: 3,
  },
});
