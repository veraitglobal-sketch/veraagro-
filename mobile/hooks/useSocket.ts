import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  missionId?: string;
  batchId?: string;
  deliveryId?: string;
}

/**
 * Socket.io hook for real-time notifications
 * Connects to backend and listens for live updates
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        // Get auth token
        const token = await AsyncStorage.getItem('auth_token');
        
        if (!token) {
          console.warn('No auth token found, skipping socket connection');
          return;
        }

        // Create socket connection
        const newSocket = io(`${API_URL}/notifications`, {
          auth: {
            token,
          },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        });

        socketRef.current = newSocket;

        // Connection events
        newSocket.on('connect', () => {
          console.log('Socket connected');
          if (mounted) {
            setConnected(true);
            setSocket(newSocket);
          }
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          if (mounted) {
            setConnected(false);
          }
        });

        newSocket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          if (mounted) {
            setConnected(false);
          }
        });

        // Notification events
        newSocket.on('notification', (notification: Notification) => {
          console.log('Received notification:', notification);
          if (mounted) {
            setNotifications(prev => [notification, ...prev]);
          }
        });

        newSocket.on('notifications', (notificationsList: Notification[]) => {
          console.log('Received notifications list:', notificationsList.length);
          if (mounted) {
            setNotifications(notificationsList);
          }
        });

      } catch (error) {
        console.error('Error connecting socket:', error);
      }
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      mounted = false;
      if (socketRef.current) {
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
