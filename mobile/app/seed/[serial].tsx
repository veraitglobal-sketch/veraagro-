import { Redirect, useLocalSearchParams } from 'expo-router';

/** Custom scheme: biovera://seed/<serial> */
export default function BioVeraSeedDeepLink() {
  const { serial } = useLocalSearchParams<{ serial: string }>();
  if (!serial) return null;
  return <Redirect href={`/s/${encodeURIComponent(String(serial))}`} />;
}
