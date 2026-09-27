import { ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { BuyerDeliveryPanel } from '../../../features/buyer/delivery/BuyerDeliveryPanel';
import { BioVeraSubpageHeader } from '../../../components/BioVeraSubpageHeader';
import { useTranslation } from 'react-i18next';
export default function BuyerDeliveryScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) || '';
  const { t } = useTranslation();
  return <><BioVeraSubpageHeader title={t('deliveryFlow.title')} left="back" />
    <ScrollView contentContainerStyle={{ padding: 20 }}><BuyerDeliveryPanel key={id} deliveryId={id} /></ScrollView></>;
}
