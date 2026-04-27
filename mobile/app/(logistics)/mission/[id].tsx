import { useLocalSearchParams } from 'expo-router';
import MissionDetailScreen from '../../../features/grower/missions/MissionDetailScreen';

export default function LogisticsMissionDetailRoute() {
  const params = useLocalSearchParams<{ id: string }>();
  const missionId =
    typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : undefined;
  return <MissionDetailScreen missionId={missionId} />;
}
