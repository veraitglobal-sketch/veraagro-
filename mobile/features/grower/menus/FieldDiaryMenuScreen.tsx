import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FileText, TrendingUp } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Dnevnik — rad na njivi + rast (jedan ulaz). */
export default function FieldDiaryMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'field-log',
        title: t('producer.hubs.field.workflow.fieldLogTitle'),
        subtitle: t('producer.hubs.field.workflow.fieldLogDesc'),
        icon: FileText,
        onPress: () => router.push('/(producer)/(tabs)/field-log'),
      },
      {
        key: 'growth',
        title: t('producer.hubs.field.workflow.growthJournalTitle'),
        subtitle: t('producer.hubs.field.workflow.growthJournalDesc'),
        icon: TrendingUp,
        onPress: () => router.push('/(producer)/growth-journal'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.hubs.field.groups.diaryTitle')}
      description={t('producer.hubs.field.groups.diaryDesc')}
      items={items}
    />
  );
}
