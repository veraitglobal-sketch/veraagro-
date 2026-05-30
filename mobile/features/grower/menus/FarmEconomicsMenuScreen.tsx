import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Package, Calculator } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Proizvodi i troškovi — jedan ulaz. */
export default function FarmEconomicsMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'products',
        title: t('producer.hubs.supplies.workflow.productsTitle'),
        subtitle: t('producer.hubs.supplies.workflow.productsDesc'),
        icon: Package,
        onPress: () => router.push('/(producer)/(tabs)/products'),
      },
      {
        key: 'cost-calculator',
        title: t('producer.hubs.supplies.workflow.costCalculatorTitle'),
        subtitle: t('producer.hubs.supplies.workflow.costCalculatorDesc'),
        icon: Calculator,
        onPress: () => router.push('/(producer)/(tabs)/cost-calculator'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.supplies.groups.economicsTitle')}
      description={t('producer.hubs.supplies.groups.economicsDesc')}
      items={items}
    />
  );
}
