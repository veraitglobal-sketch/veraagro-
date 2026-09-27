import axios, { type AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiUrl, API_URL } from '../api-url';
import { notifyAuthUnauthorized } from '../auth-events';

export { getApiUrl, API_URL, PRODUCTION_API_URL } from '../api-url';

/** 401 on these routes is credential/registration UX, not an expired JWT. */
export function isAuthNegotiationUrl(url: string | undefined): boolean {
  if (!url) return false;
  const path = url.split('?')[0].replace(/\\/g, '/');
  const lower = path.toLowerCase();
  return (
    lower.endsWith('/auth/login') ||
    lower.endsWith('auth/login') ||
    lower.includes('/auth/register') ||
    lower.includes('/auth/verify-email')
  );
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 25000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token:', error);
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status;
    const reqUrl = error.config?.url;
    if (status === 401 && !isAuthNegotiationUrl(reqUrl)) {
      if (__DEV__) console.warn('[auth] 401 → logout, from', error.config?.method, reqUrl);
      notifyAuthUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
