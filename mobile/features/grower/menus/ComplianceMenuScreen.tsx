import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { FileCheck, ShieldAlert } from 'lucide-react-native';
import { GrowerMenuScaffold } from '../../../design-system/scaffolds/GrowerMenuScaffold';

/** Usklađenost — sertifikati + zabranjene supstance. */
export default function ComplianceMenuScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'certifications',
        title: t('producer.tabs.certifications'),
        subtitle: t('producer.dashboard.certificationsDesc'),
        icon: FileCheck,
        onPress: () => router.push('/(producer)/(tabs)/certifications'),
      },
      {
        key: 'banned-substances',
        title: t('producer.tabs.bannedSubstances'),
        subtitle: t('producer.dashboard.bannedSubstancesDesc'),
        icon: ShieldAlert,
        onPress: () => router.push('/(producer)/(tabs)/banned-substances'),
      },
    ],
    [router, t],
  );

  return (
    <GrowerMenuScaffold
      title={t('producer.profile.compliance.screenTitle')}
      description={t('producer.profile.compliance.screenDesc')}
      items={items}
    />
  );
}
