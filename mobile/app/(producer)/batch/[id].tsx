import { useLocalSearchParams } from 'expo-router';
import BatchDetailScreen from '../../../features/grower/batches/BatchDetailScreen';

/**
 * Batch detail – tanki wrapper; logika i UI u features/grower/batches/
 */
export default function BatchDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const batchId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  return <BatchDetailScreen batchId={batchId} />;
}
