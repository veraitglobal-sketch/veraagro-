'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { notificationsAPI } from '@/lib/api';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';
import { dateIntlLocaleFromLanguageTag } from '@/lib/i18n-routing';

interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  status: 'UNREAD' | 'READ';
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  userId?: string;
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const dateLocale = dateIntlLocaleFromLanguageTag(i18n.resolvedLanguage ?? i18n.language);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const openActionUrl = useCallback(
    (url: string) => {
      const raw = url.trim();
      if (!raw) return;
      setIsOpen(false);
      if (/^https?:\/\//i.test(raw)) {
        window.location.href = raw;
        return;
      }
      const path = raw.startsWith('/') ? raw : `/${raw}`;
      router.push(path);
    },
    [router],
  );

  const loadNotifications = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const data = await notificationsAPI.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => n.status === 'UNREAD').length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useNotificationSocket(Boolean(userId), () => {
    void loadNotifications({ silent: true });
  });

  useEffect(() => {
    if (userId) {
      void loadNotifications();
      // Fallback ako socket nije dostupan — sporiji interval jer push dolazi preko Socket.IO
      const interval = setInterval(() => {
        void loadNotifications({ silent: true });
      }, 90_000);
      return () => clearInterval(interval);
    }
  }, [userId, loadNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as const, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: 'READ' as const, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACTION_REQUIRED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'ALERT':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'REMINDER':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const unreadNotifications = notifications.filter((n) => n.status === 'UNREAD');
  const readNotifications = notifications.filter((n) => n.status === 'READ');

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col"
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{t('notificationCenter.title')}</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      {t('notificationCenter.markAllRead')}
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">{t('notificationCenter.loading')}</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{t('notificationCenter.empty')}</p>
                  </div>
                ) : (
                  <>
                    {unreadNotifications.length > 0 && (
                      <div className="p-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                          {t('notificationCenter.unreadSection', { count: unreadNotifications.length })}
                        </p>
                        {unreadNotifications.map((notification) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-l-4 border-green-500"
                            onClick={() => {
                              markAsRead(notification.id);
                              if (notification.actionUrl) {
                                openActionUrl(notification.actionUrl);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString(dateLocale)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {readNotifications.length > 0 && (
                      <div className="p-2 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase px-2 mb-2">
                          {t('notificationCenter.readSection', { count: readNotifications.length })}
                        </p>
                        {readNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer opacity-60"
                            onClick={() => {
                              if (notification.actionUrl) {
                                openActionUrl(notification.actionUrl);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
