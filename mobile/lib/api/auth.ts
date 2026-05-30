import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './client';

export const authAPI = {
  login: async (partnerCode: string, password: string) => {
    const response = await api.post('/auth/login', { username: partnerCode, password });
    return response.data;
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
  },
  registerGrower: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    totalHectares?: number;
  }) => {
    const response = await api.post('/auth/register/grower', data);
    return response.data;
  },
  verifyEmail: async (token: string) => {
    const response = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return response.data;
  },
};
