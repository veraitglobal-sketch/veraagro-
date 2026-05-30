import { useTranslation } from 'react-i18next';
import { SegmentedGrowerScreen } from '../../../design-system/SegmentedGrowerScreen';
import HarvestScreen from '../harvest/HarvestScreen';
import VeraBagScreen from '../vera-bag/VeraBagScreen';

/** Berba — žetva + Vera Bag foto dokazi na jednoj stranici. */
export default function HarvestUnifiedScreen() {
  const { t } = useTranslation();

  return (
    <SegmentedGrowerScreen
      title={t('producer.hubs.field.groups.harvestTitle')}
      description={t('producer.hubs.field.groups.harvestDesc')}
      segments={[
        { key: 'harvest', label: t('producer.hubs.field.workflow.harvestTitle') },
        { key: 'vera-bag', label: t('producer.hubs.field.workflow.veraBagTitle') },
      ]}
      renderSegment={(key) =>
        key === 'vera-bag' ? <VeraBagScreen embedded /> : <HarvestScreen embedded />
      }
    />
  );
}
