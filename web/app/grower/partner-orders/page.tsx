import { redirect } from 'next/navigation';

/** Old URL — one screen with directory + B2B activity lives under /grower/where-to-buy */
export default function GrowerPartnerOrdersLegacyRedirect() {
  redirect('/grower/where-to-buy');
}
