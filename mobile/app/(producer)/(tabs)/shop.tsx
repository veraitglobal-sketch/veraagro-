import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Growers have no Shop tab — redirect to My products.
 * Ruta ostaje zbog Expo Router; odmah redirect.
 */
export default function ShopRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(producer)/(tabs)/products');
  }, [router]);

  return null;
}
