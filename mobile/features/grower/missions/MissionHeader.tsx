import { useTranslation } from 'react-i18next';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { router, useSegments } from 'expo-router';

export default function MissionHeader() {
  const { t } = useTranslation();
  const segments = useSegments();
  const isLogistics = segments[0] === '(logistics)';

  return (
    <BioVeraSubpageHeader
      title={t('producer.missions.detailScreenTitle')}
      left="back"
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace(isLogistics ? ('/(logistics)' as const) : '/');
        }
      }}
    />
  );
}
