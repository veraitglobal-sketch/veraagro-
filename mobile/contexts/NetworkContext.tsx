import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { isDeviceOnline } from '../lib/network-utils';

type NetworkValue = {
  isOnline: boolean;
  isChecking: boolean;
  recheck: () => Promise<void>;
};

const NetworkContext = createContext<NetworkValue | null>(null);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  const recheck = useCallback(async () => {
    setIsChecking(true);
    try {
      setIsOnline(await isDeviceOnline());
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    void recheck();
  }, [recheck]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') void recheck();
    });
    return () => sub.remove();
  }, [recheck]);

  const value = useMemo(
    () => ({ isOnline, isChecking, recheck }),
    [isOnline, isChecking, recheck],
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    return { isOnline: true, isChecking: false, recheck: async () => {} };
  }
  return ctx;
}
