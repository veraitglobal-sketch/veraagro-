import { useLocalSearchParams } from 'expo-router';
import OrderDetailScreen from '../../../features/grower/orders/OrderDetailScreen';

/**
 * Order detail – tanki wrapper; logika i UI u features/grower/orders/
 */
export default function OrderDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const orderId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  return <OrderDetailScreen orderId={orderId} />;
}
