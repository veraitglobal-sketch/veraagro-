import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDashboardData } from '../features/grower/dashboard/useDashboardData';

type GrowerDashboardValue = ReturnType<typeof useDashboardData>;

const GrowerDashboardContext = createContext<GrowerDashboardValue | null>(null);

/** One dashboard fetch + socket for all grower tabs (home, field, chain, supplies). */
export function GrowerDashboardProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const value = useDashboardData(user);
  return <GrowerDashboardContext.Provider value={value}>{children}</GrowerDashboardContext.Provider>;
}

export function useGrowerDashboard(): GrowerDashboardValue {
  const ctx = useContext(GrowerDashboardContext);
  if (!ctx) {
    throw new Error('useGrowerDashboard must be used within GrowerDashboardProvider');
  }
  return ctx;
}
