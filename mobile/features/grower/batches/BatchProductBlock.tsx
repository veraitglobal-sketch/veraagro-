import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { useAppLocaleTag } from '../../../lib/date-locale';
import { productNameLabel } from '../../../../shared/i18n/labels';

export default function BatchProductBlock({ batch }: { batch: any }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: theme.colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Package size={18} color={theme.colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '400', color: theme.colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.batches.product')}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {productNameLabel(t, batch.productName) || t('producer.batches.unknownProduct')}
      </Text>
      {batch.quantity && (
        <Text style={{ fontSize: 13, fontWeight: '400', color: theme.colors.text.secondary }}>
          {t('producer.batches.quantity')}: {batch.quantity} {batch.unit || 'kg'}
        </Text>
      )}
      {batch.harvestDate && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          <Calendar size={14} color={theme.colors.text.secondary} strokeWidth={1} />
          <Text style={{ fontSize: 14, fontWeight: '400', color: theme.colors.text.secondary, marginLeft: 4 }}>
            {`${t('producer.batches.harvestLabel')}: ${new Date(batch.harvestDate).toLocaleDateString(dateLocale)}`}
          </Text>
        </View>
      )}
    </View>
  );
}
