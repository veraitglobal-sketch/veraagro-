import { useTranslation } from 'react-i18next';
import { SegmentedGrowerScreen } from '../../../design-system/SegmentedGrowerScreen';
import SeedRegistrationScreen from '../seed-registration/SeedRegistrationScreen';
import PlantingsScreen from '../plantings/PlantingsScreen';

/** Setva — seme + zasadi na jednoj stranici. */
export default function CultivationUnifiedScreen() {
  const { t } = useTranslation();

  return (
    <SegmentedGrowerScreen
      title={t('producer.hubs.field.groups.cultivationTitle')}
      description={t('producer.hubs.field.groups.cultivationDesc')}
      segments={[
        { key: 'seed', label: t('producer.hubs.field.workflow.seedTitle') },
        { key: 'plantings', label: t('producer.hubs.field.workflow.plantingsTitle') },
      ]}
      renderSegment={(key) =>
        key === 'plantings' ? (
          <PlantingsScreen embedded />
        ) : (
          <SeedRegistrationScreen embedded />
        )
      }
    />
  );
}
