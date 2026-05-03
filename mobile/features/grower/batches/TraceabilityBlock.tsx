import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { User, Truck, MapPin } from 'lucide-react-native';
import { theme } from '../../../lib/theme';
import { colors } from '../../../lib/colors';

function personLabel(p: { firstName?: string; lastName?: string; name?: string } | null | undefined): string {
  if (!p) return '';
  if (p.name) return p.name;
  return [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
}

export default function TraceabilityBlock({ batch }: { batch: any }) {
  const { t } = useTranslation();
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
      <Text style={{ fontSize: 15, fontWeight: '300', color: colors.text.primary, marginBottom: theme.spacing.md, letterSpacing: 0.3 }}>
        {t('producer.batches.traceabilityTitle')}
      </Text>
      {batch.harvestedBy && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <User size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>{t('producer.batches.harvestLabel')}</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {personLabel(batch.harvestedBy) || '—'}
            </Text>
          </View>
        </View>
      )}
      {batch.transportedByDriver && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm, paddingBottom: theme.spacing.sm, borderBottomWidth: 0.5, borderBottomColor: colors.border }}>
          <Truck size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>{t('producer.batches.transportCarrierLabel')}</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {personLabel(batch.transportedByDriver)}
            </Text>
          </View>
        </View>
      )}
      {batch.currentHub && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MapPin size={14} color={colors.text.secondary} strokeWidth={1} />
          <View style={{ marginLeft: theme.spacing.xs, flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: '300', color: colors.text.secondary }}>{t('producer.batches.currentLocation')}</Text>
            <Text style={{ fontSize: 13, fontWeight: '300', color: colors.text.primary }}>
              {batch.currentHub.name || t('producer.batches.hubNameFallback')}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
