import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import { EnterpriseNavSection } from '../../../components/enterprise/EnterpriseNavSection';

/** Profile-only shortcuts — hub destinations live on Polje / Lanac / Nabavka tabs. */
export function QuickAccessGrid() {
  const { t } = useTranslation();
  const router = useRouter();

  const items = useMemo(
    () => [
      {
        key: 'settings',
        title: t('producer.tabs.settings'),
        icon: Settings,
        onPress: () => router.push('/(producer)/(tabs)/settings'),
      },
    ],
    [t, router],
  );

  return <EnterpriseNavSection title={t('producer.profile.quickAccess')} items={items} />;
}
