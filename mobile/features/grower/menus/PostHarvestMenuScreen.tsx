import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Camera, ClipboardCheck, Package } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Posle berbe — pakovanje, kvalitet, compliance (jedan ulaz). */
export default function PostHarvestMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'packing',
        title: t('producer.hubs.chain.workflow.packingTitle'),
        subtitle: t('producer.hubs.chain.workflow.packingDesc'),
        icon: Package,
        onPress: () => router.push('/(producer)/packing-flow'),
      },
      {
        key: 'quality',
        title: t('producer.hubs.chain.workflow.qualityTitle'),
        subtitle: t('producer.hubs.chain.workflow.qualityDesc'),
        icon: ClipboardCheck,
        onPress: () => router.push('/(producer)/quality-entry'),
      },
      {
        key: 'compliance',
        title: t('producer.hubs.chain.workflow.complianceTitle'),
        subtitle: t('producer.hubs.chain.workflow.complianceDesc'),
        icon: Camera,
        onPress: () => router.push('/(producer)/compliance-photos'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.chain.groups.postHarvestTitle')}
      description={t('producer.hubs.chain.groups.postHarvestDesc')}
      items={items}
    />
  );
}
