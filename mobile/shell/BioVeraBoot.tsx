import type { ReactNode } from 'react';
import { useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuth } from '../hooks/useAuth';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

type Props = {
  children: ReactNode;
};

/** Holds native splash until auth bootstrap completes. */
export function BioVeraBoot({ children }: Props) {
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    void SplashScreen.hideAsync().catch(() => undefined);
  }, [loading]);

  if (loading) return null;

  return <>{children}</>;
}
