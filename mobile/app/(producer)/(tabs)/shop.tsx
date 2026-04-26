import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Growers have no Shop tab — redirect to My products.
 * Route kept for Expo Router; redirects immediately.
 */
export default function ShopRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(producer)/(tabs)/products');
  }, [router]);

  return null;
}
