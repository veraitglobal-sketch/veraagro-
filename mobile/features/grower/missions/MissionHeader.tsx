import { useTranslation } from 'react-i18next';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { router, useSegments } from 'expo-router';
import { replaceToRoleHome } from '../../../lib/app-navigation';

export default function MissionHeader() {
  const { t } = useTranslation();
  const segments = useSegments();
  const isLogistics = segments[0] === '(logistics)';

  return (
    <BioVeraSubpageHeader
      title={t('producer.missions.details')}
      left="back"
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else if (isLogistics) {
          router.replace('/(logistics)/(tabs)/missions');
        } else {
          replaceToRoleHome(segments);
        }
      }}
    />
  );
}
