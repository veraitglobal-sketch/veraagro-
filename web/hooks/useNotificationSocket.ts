'use client';

import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { WEB_API_BASE } from '@/lib/api-base';

/**
 * Socket.io client for `/notifications` — same namespace and path as mobile `useSocket`
 * and `backend/src/notifications/notifications.gateway.ts`.
 */
export function useNotificationSocket(enabled: boolean, onServerPush: () => void) {
  const cbRef = useRef(onServerPush);
  cbRef.current = onServerPush;
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const base = WEB_API_BASE.replace(/\/$/, '');
    const s = io(`${base}/notifications`, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
      reconnectionAttempts: Infinity,
      timeout: 20_000,
    });
    socketRef.current = s;

    const refresh = () => {
      cbRef.current();
    };

    s.on('connect', refresh);
    s.on('notification', refresh);
    s.on('notifications', refresh);
    s.on('batch:updated', refresh);

    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
    };
  }, [enabled]);
}
