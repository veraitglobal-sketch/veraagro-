import { useLocalSearchParams } from 'expo-router';
import OrderDetailScreen from '../../../features/grower/orders/OrderDetailScreen';

/**
 * Order detail – tanki wrapper; logika i UI u features/grower/orders/
 */
export default function OrderDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <OrderDetailScreen orderId={id} />;
}
