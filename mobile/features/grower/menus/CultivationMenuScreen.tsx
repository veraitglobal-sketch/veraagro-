import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Leaf, Sprout } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Setva — seme + zasadi (jedan ulaz umesto dve hub kartice). */
export default function CultivationMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'seed',
        title: t('producer.hubs.field.workflow.seedTitle'),
        subtitle: t('producer.hubs.field.workflow.seedDesc'),
        icon: Leaf,
        onPress: () => router.push('/(producer)/seed-registration'),
      },
      {
        key: 'plantings',
        title: t('producer.hubs.field.workflow.plantingsTitle'),
        subtitle: t('producer.hubs.field.workflow.plantingsDesc'),
        icon: Sprout,
        onPress: () => router.push('/(producer)/plantings'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.field.groups.cultivationTitle')}
      description={t('producer.hubs.field.groups.cultivationDesc')}
      items={items}
    />
  );
}
