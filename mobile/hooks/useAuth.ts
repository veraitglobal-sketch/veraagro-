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
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username, // Can be email or partnerCode
        password,
      });

      const { access_token, user } = response.data;

      // Store auth data
      await AsyncStorage.setItem('auth_token', access_token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(user));

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

      setAuthState({
        user,
        token: access_token,
        loading: false,
      });

      return { user, token: access_token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
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
