import { useTranslation } from 'react-i18next';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';

export default function OrderDetailHeader() {
  const { t } = useTranslation();
  return <BioVeraSubpageHeader title={t('producer.orders.orderDetails')} left="back" />;
}
