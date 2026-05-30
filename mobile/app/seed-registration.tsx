import { Redirect } from 'expo-router';

/** Legacy global route — seed registration lives under producer shell (AuthGuard + offline). */
export default function SeedRegistrationRedirect() {
  return <Redirect href="/(producer)/seed-registration" />;
}
