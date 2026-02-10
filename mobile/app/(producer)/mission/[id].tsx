import { useLocalSearchParams } from 'expo-router';
import MissionDetailScreen from '../../../features/grower/missions/MissionDetailScreen';

/**
 * Mission detail – tanki wrapper; logika i UI u features/grower/missions/
 */
export default function MissionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MissionDetailScreen missionId={id} />;
}
