import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Box, ShoppingBag, MapPinned } from 'lucide-react-native';
import { View } from 'react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';
import { EnterpriseButton } from '../../../design-system';

/** Nabavka — materijali + partner porudžbine + mapa. */
export default function ProcurementMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'materials',
        title: t('producer.hubs.supplies.workflow.materialsTitle'),
        subtitle: t('producer.hubs.supplies.workflow.materialsDesc'),
        icon: Box,
        onPress: () => router.push('/(producer)/materials'),
      },
      {
        key: 'partner-orders',
        title: t('producer.hubs.supplies.workflow.partnerOrdersTitle'),
        subtitle: t('producer.hubs.supplies.workflow.partnerOrdersDesc'),
        icon: ShoppingBag,
        onPress: () => router.push('/(producer)/partner-orders'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.supplies.groups.procurementTitle')}
      description={t('producer.hubs.supplies.groups.procurementDesc')}
      items={items}
      footer={
        <View style={{ marginTop: 12 }}>
          <EnterpriseButton
            label={t('producer.hubs.supplies.workflow.mapTitle')}
            onPress={() => router.push('/map')}
            variant="secondary"
            fullWidth
            icon={<MapPinned size={18} color="#2D5A27" strokeWidth={1.5} />}
          />
        </View>
      }
    />
  );
}
