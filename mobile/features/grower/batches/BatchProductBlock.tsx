import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Package, Calendar } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';
import { useAppLocaleTag } from '../../../lib/date-locale';

export default function BatchProductBlock({ batch }: { batch: any }) {
  const { t } = useTranslation();
  const dateLocale = useAppLocaleTag();
  return (
    <View
      style={{
        backgroundColor: colors.background,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderWidth: 0.5,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm }}>
        <Package size={18} color={colors.text.primary} strokeWidth={1} />
        <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginLeft: theme.spacing.xs, letterSpacing: 0.3 }}>
          {t('producer.batches.product')}
        </Text>
      </View>
      <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary, marginBottom: theme.spacing.xs }}>
        {batch.productName || t('producer.batches.unknownProduct')}
      </Text>
      {batch.quantity && (
        <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.secondary }}>
          {t('producer.batches.quantity')}: {batch.quantity} {batch.unit || 'kg'}
        </Text>
      )}
      {batch.harvestDate && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: theme.spacing.xs }}>
          <Calendar size={14} color={colors.text.secondary} strokeWidth={1} />
          <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary, marginLeft: 4 }}>
            {`${t('producer.batches.harvestLabel')}: ${new Date(batch.harvestDate).toLocaleDateString(dateLocale)}`}
          </Text>
        </View>
      )}
    </View>
  );
}
