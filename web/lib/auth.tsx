'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from './api';

export interface CommercialAgentPublic {
  id: string;
  firstName: string;
  lastName: string;
  partnerCode: string;
  email?: string | null;
  phone?: string | null;
  commercial_agent_profile?: {
    officeName?: string | null;
    address: string;
    city: string;
    country: string;
    postalCode?: string | null;
  } | null;
}

interface User {
  id: string;
  partnerCode: string;
  roles: string[]; // Array of roles
  firstName?: string;
  lastName?: string;
  /** Set by the team in admin — your Bio Vera field contact */
  assignedCommercialAgent?: CommercialAgentPublic | null;
}

interface AuthContextType {
  user: User | null;
  login: (partnerCode: string, password: string) => Promise<User | null>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const currentUser = authAPI.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (partnerCode: string, password: string) => {
    const response = await authAPI.login(partnerCode, password);
    const u = (response as { user?: User }).user ?? null;
    if (u) setUser(u);
    return u;
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isLoading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
