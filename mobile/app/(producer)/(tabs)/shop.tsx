import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Growers nema Shop – preusmeri na Moji proizvodi.
 * Ruta ostaje zbog Expo Router; odmah redirect.
 */
export default function ShopRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/(producer)/(tabs)/products');
  }, [router]);

  return null;
}
