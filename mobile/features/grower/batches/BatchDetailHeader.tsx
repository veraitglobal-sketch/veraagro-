import { useTranslation } from 'react-i18next';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';

export default function BatchDetailHeader() {
  const { t } = useTranslation();
  return <BioVeraSubpageHeader title={t('producer.batches.details')} left="back" />;
}
