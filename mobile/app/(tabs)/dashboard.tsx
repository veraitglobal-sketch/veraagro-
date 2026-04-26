import { Redirect } from 'expo-router';

/** Legacy `/(tabs)/dashboard` — use grower tabs home instead. */
export default function LegacyTabsDashboard() {
  return <Redirect href="/(producer)/(tabs)" />;
}
