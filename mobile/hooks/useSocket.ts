import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../lib/api-url';
import { requestBatchListRefresh } from '../lib/batch-refresh';

interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  read?: boolean;
  actionUrl?: string;
  missionId?: string;
  batchId?: string;
  deliveryId?: string;
}

/**
 * Socket.io hook for real-time notifications.
 * Call once per screen tree (e.g. only inside `useDashboardData`) to avoid duplicate connections
 * and connect/disconnect churn.
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');

        if (!token) {
          console.warn('No auth token found, skipping socket connection');
          return;
        }

        if (socketRef.current?.connected) {
          return;
        }
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        const newSocket = io(`${API_URL}/notifications`, {
          path: '/socket.io',
          auth: {
            token,
          },
          // Polling first: works through more CDNs / proxies; RN is less flaky than WS-only
          transports: ['polling', 'websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 10_000,
          reconnectionAttempts: Infinity,
          timeout: 20_000,
        });

        socketRef.current = newSocket;

        newSocket.on('connect', () => {
          console.log('Socket connected');
          if (mounted) {
            setConnected(true);
            setSocket(newSocket);
          }
        });

        newSocket.on('disconnect', (reason) => {
          console.log('Socket disconnected', reason);
          if (mounted) {
            setConnected(false);
          }
        });

        let connectErrorLogCount = 0;
        newSocket.on('connect_error', (error) => {
          // Do not use console.error: React Native LogBox shows it as a blocking "Console Error" overlay
          if (mounted) {
            setConnected(false);
          }
          connectErrorLogCount += 1;
          if (connectErrorLogCount === 1 || connectErrorLogCount % 6 === 0) {
            const msg = error instanceof Error ? error.message : String(error);
            const hint = __DEV__
              ? ' On a real device, set EXPO_PUBLIC_API_URL to http://<LAN-IP> (same host/port as the REST API).'
              : '';
            console.warn(`[notifications] Socket connect issue (reconnecting): ${msg}.${hint}`);
          }
        });

        newSocket.on('batch:updated', () => {
          if (mounted) {
            requestBatchListRefresh();
          }
        });

        newSocket.on('notification', (notification: Notification) => {
          console.log('Received notification:', notification);
          if (mounted) {
            setNotifications((prev) => [notification, ...prev]);
            if (notification.batchId || notification.title?.toLowerCase().includes('batch')) {
              requestBatchListRefresh();
            }
          }
        });

        newSocket.on('notifications', (notificationsList: Notification[]) => {
          console.log('Received notifications list:', notificationsList.length);
          if (mounted) {
            setNotifications(notificationsList);
          }
        });
      } catch (error) {
        console.warn('Error setting up socket:', error instanceof Error ? error.message : error);
      }
    };

    void connectSocket();

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;
      if (prev.match(/inactive|background/) && next === 'active') {
        const s = socketRef.current;
        if (s && !s.connected) {
          s.connect();
        } else if (!s) {
          void connectSocket();
        }
      }
    });

    return () => {
      mounted = false;
      sub.remove();
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const clearNotifications = () => {
    setNotifications([]);
  };

  return {
    socket,
    connected,
    notifications,
    clearNotifications,
  };
}
