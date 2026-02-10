import { useLocalSearchParams } from 'expo-router';
import MissionDetailScreen from '../../../features/grower/missions/MissionDetailScreen';

/**
 * Mission detail – tanki wrapper; logika i UI u features/grower/missions/
 */
export default function MissionDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const missionId = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  return <MissionDetailScreen missionId={missionId} />;
}
