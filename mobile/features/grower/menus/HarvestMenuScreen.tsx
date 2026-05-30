import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Scissors, Camera } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Berba — žetva + foto dokazi. */
export default function HarvestMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'harvest',
        title: t('producer.hubs.field.workflow.harvestTitle'),
        subtitle: t('producer.hubs.field.workflow.harvestDesc'),
        icon: Scissors,
        onPress: () => router.push('/(producer)/(tabs)/harvest'),
      },
      {
        key: 'vera-bag',
        title: t('producer.hubs.field.workflow.veraBagTitle'),
        subtitle: t('producer.hubs.field.workflow.veraBagDesc'),
        icon: Camera,
        onPress: () => router.push('/(producer)/vera-bag'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.field.groups.harvestTitle')}
      description={t('producer.hubs.field.groups.harvestDesc')}
      items={items}
    />
  );
}
