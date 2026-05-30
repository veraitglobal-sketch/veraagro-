import { useTranslation } from 'react-i18next';
import { SegmentedGrowerScreen } from '../../../design-system/SegmentedGrowerScreen';
import FieldLogWizard from '../field-log/FieldLogWizard';
import GrowthJournalScreen from '../growth-journal/GrowthJournalScreen';

/** Dnevnik — rad na njivi + rast na jednoj stranici (tabovi). */
export default function FieldDiaryUnifiedScreen() {
  const { t } = useTranslation();

  return (
    <SegmentedGrowerScreen
      title={t('producer.hubs.field.groups.diaryTitle')}
      description={t('producer.hubs.field.groups.diaryDesc')}
      segments={[
        { key: 'work', label: t('producer.tabs.fieldLog') },
        { key: 'growth', label: t('producer.growthJournal.title') },
      ]}
      renderSegment={(key) =>
        key === 'growth' ? (
          <GrowthJournalScreen embedded />
        ) : (
          <FieldLogWizard embedded />
        )
      }
    />
  );
}
