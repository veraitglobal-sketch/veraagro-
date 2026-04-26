import { Redirect } from 'expo-router';

/** Legacy route — real grower home is `/(producer)/(tabs)`. */
export default function ProducerDashboardScreen() {
  return <Redirect href="/(producer)/(tabs)" />;
}
