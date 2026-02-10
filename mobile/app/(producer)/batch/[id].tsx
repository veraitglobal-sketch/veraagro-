import { useLocalSearchParams } from 'expo-router';
import BatchDetailScreen from '../../../features/grower/batches/BatchDetailScreen';

/**
 * Batch detail – tanki wrapper; logika i UI u features/grower/batches/
 */
export default function BatchDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BatchDetailScreen batchId={id} />;
}
