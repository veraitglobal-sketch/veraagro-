import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../lib/api-url';
import { axiosLikeMessage } from '../lib/api-error';
import { setAuthUnauthorizedHandler } from '../lib/auth-events';
import { replaceToSignIn } from '../lib/app-navigation';
import { refreshPushRegistrationIfAuthed, unregisterPushTokenFromBackend } from '../lib/push-service';

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
  const logoutPending = useRef<Promise<void> | null>(null);

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

  const logout = useCallback(async () => {
    if (logoutPending.current) return logoutPending.current;
    logoutPending.current = (async () => {
      try {
        await unregisterPushTokenFromBackend();
      } catch (error) {
        console.warn('[Auth] push cleanup failed', error);
      } finally {
        try {
          // Session only — offline queues stay on device (scoped per userId).
          await AsyncStorage.multiRemove(['auth_token', 'auth_user']);
        } finally {
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
          setToken(null);
        }
      }
    })();
    try {
      await logoutPending.current;
    } finally {
      logoutPending.current = null;
    }
  }, []);

  useEffect(() => {
    void loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    const onUnauthorized = () => {
      return (async () => {
        await logout();
        try {
          replaceToSignIn();
        } catch {
          // Navigator may not be ready on rare early ticks.
        }
      })();
    };
    setAuthUnauthorizedHandler(onUnauthorized);
    return () => setAuthUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(
    async (username: string, password: string) => {
      const body = { username, password };
      const urlsToTry = [
        `${API_URL}/auth/login`,
        `${API_URL.replace(/\/$/, '')}/api/auth/login`,
      ];
      let lastError: unknown = null;
      for (const url of urlsToTry) {
        try {
          const response = await axios.post(url, body, { timeout: 25000 });
          const { access_token, user: u } = response.data;
          if (!access_token || !u) {
            throw new Error('Invalid response from server');
          }
          await AsyncStorage.setItem('auth_token', access_token);
          await AsyncStorage.setItem('auth_user', JSON.stringify(u));
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          setUser(u);
          setToken(access_token);
          void refreshPushRegistrationIfAuthed(
            Array.isArray(u.roles) ? u.roles : u.role ? [u.role] : undefined,
          ).catch((e) => {
            console.warn('[Auth] push registration skipped:', e instanceof Error ? e.message : e);
          });
          return { user: u as User, token: access_token };
        } catch (err: unknown) {
          lastError = err;
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status !== 404) break;
        }
      }
      const err = lastError;
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number } }).response : undefined;
      if (!res) {
        const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined;
        const msg =
          code === 'ECONNABORTED'
            ? 'Request timeout. Check your connection.'
            : 'Cannot reach server. Check EXPO_PUBLIC_API_URL and that the backend is running.';
        throw new Error(msg);
      }
      if (res.status === 404) {
        throw new Error(
          'Login endpoint not found (404). Set EXPO_PUBLIC_API_URL to your backend URL (e.g. https://api.biovera.app), not the website.',
        );
      }
      const data = (err as { response?: { data?: { code?: string; message?: string | string[] } } })?.response?.data;
      if (data?.code === 'ACCOUNT_PENDING_APPROVAL') {
        const pending = new Error('ACCOUNT_PENDING_APPROVAL') as Error & { code: string };
        pending.code = 'ACCOUNT_PENDING_APPROVAL';
        throw pending;
      }
      const fromApi = axiosLikeMessage(err);
      throw new Error(fromApi || `Login failed (${res.status})`);
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
