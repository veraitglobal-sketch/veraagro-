import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../lib/api-url';

interface User {
  id: string;
  partnerCode: string;
  role?: string;
  roles?: string[];
  firstName: string;
  lastName: string;
  email?: string;
  trustScore?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStoredAuth = useCallback(async () => {
    try {
      const t = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      if (t && userStr) {
        const u = JSON.parse(userStr) as User;
        setToken(t);
        setUser(u);
        axios.defaults.headers.common['Authorization'] = `Bearer ${t}`;
      } else {
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
    } catch (e) {
      console.error('Error loading auth', e);
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStoredAuth();
  }, [loadStoredAuth]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setToken(null);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const body = { username, password };
      const urlsToTry = [
        `${API_URL}/auth/login`,
        `${API_URL.replace(/\/$/, '')}/api/auth/login`,
      ];
      let lastError: any = null;
      for (const url of urlsToTry) {
        try {
          const response = await axios.post(url, body);
          const { access_token, user: u } = response.data;
          if (!access_token || !u) {
            throw new Error('Invalid response from server');
          }
          await AsyncStorage.setItem('auth_token', access_token);
          await AsyncStorage.setItem('auth_user', JSON.stringify(u));
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          setUser(u);
          setToken(access_token);
          return { user: u as User, token: access_token };
        } catch (err: any) {
          lastError = err;
          if (err.response?.status !== 404) break;
        }
      }
      const err = lastError;
      if (!err?.response) {
        const msg =
          err?.code === 'ECONNABORTED'
            ? 'Request timeout. Check your connection.'
            : 'Cannot reach server. Check EXPO_PUBLIC_API_URL and that the backend is running.';
        throw new Error(msg);
      }
      if (err.response?.status === 404) {
        throw new Error(
          'Login endpoint not found (404). Set EXPO_PUBLIC_API_URL to your backend URL (e.g. https://api.biovera.app), not the website.',
        );
      }
      const msg = err.response?.data?.message;
      const message = Array.isArray(msg) ? msg[0] : msg;
      throw new Error(message || `Login failed (${err.response?.status})`);
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
    }),
    [user, token, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
