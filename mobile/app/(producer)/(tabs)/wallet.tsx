import { Redirect } from 'expo-router';

/** Legacy tab route — wallet lives on the producer stack for correct back navigation. */
export default function WalletTabRedirect() {
  return <Redirect href="/(producer)/wallet" />;
}
