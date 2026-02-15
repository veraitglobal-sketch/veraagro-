import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

// For iOS simulator, use localhost. For physical devices, use the network IP
const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // iOS simulator can use localhost
  if (Platform.OS === 'ios' && __DEV__) {
    return 'http://localhost:3000';
  }
  // Default to network IP for physical devices
  return 'http://192.168.178.27:3000';
};

const API_URL = getApiUrl();

interface User {
  id: string;
  partnerCode: string;
  role?: string; // Backward compatibility
  roles?: string[]; // Multiple roles support
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

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userStr = await AsyncStorage.getItem('auth_user');
      
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setAuthState({ user, token, loading: false });
        
        // Set axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } else {
        setAuthState({ user: null, token: null, loading: false });
      }
    } catch (error) {
      console.error('Error loading auth:', error);
      setAuthState({ user: null, token: null, loading: false });
    }
  };

  const login = async (username: string, password: string) => {
    const body = { username, password };
    const urlsToTry = [
      `${API_URL}/auth/login`,
      `${API_URL.replace(/\/$/, '')}/api/auth/login`,
    ];

    let lastError: any = null;
    for (const url of urlsToTry) {
      try {
        const response = await axios.post(url, body);
        const { access_token, user } = response.data;

        if (!access_token || !user) {
          throw new Error('Invalid response from server');
        }

        await AsyncStorage.setItem('auth_token', access_token);
        await AsyncStorage.setItem('auth_user', JSON.stringify(user));

        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

        setAuthState({
          user,
          token: access_token,
          loading: false,
        });

        return { user, token: access_token };
      } catch (err: any) {
        lastError = err;
        // Ako nije 404, ne pokušavaj drugi URL
        if (err.response?.status !== 404) break;
      }
    }

    const error = lastError;
    if (!error.response) {
      const msg = error.code === 'ECONNABORTED'
        ? 'Request timeout. Check your connection.'
        : 'Cannot reach server. Check EXPO_PUBLIC_API_URL and that the backend is running.';
      throw new Error(msg);
    }
    if (error.response?.status === 404) {
      throw new Error(
        'Login endpoint not found (404). Set EXPO_PUBLIC_API_URL to your backend URL (e.g. https://api.biovera.app), not the website.'
      );
    }
    const msg = error.response?.data?.message;
    const message = Array.isArray(msg) ? msg[0] : msg;
    throw new Error(message || `Login failed (${error.response?.status})`);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    delete axios.defaults.headers.common['Authorization'];
    setAuthState({ user: null, token: null, loading: false });
  };

  return {
    ...authState,
    login,
    logout,
  };
}
