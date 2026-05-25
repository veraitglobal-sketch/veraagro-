import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect } from 'react';
import { Bell, AlertCircle, Info, Calendar } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { notificationsAPI, Notification } from '../../../lib/api';
import { normalizeUserRoles } from '../../../lib/post-login-redirect';
import { resolveNotificationActionHref } from '../../../lib/resolve-notification-action';
import { useAuth } from '../../../hooks/useAuth';
import { useAppLocaleTag } from '../../../lib/date-locale';

type Filter = 'all' | 'unread' | 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT';

function notificationIconColor(type: string): string {
  switch (type) {
    case 'ACTION_REQUIRED':
    case 'ALERT':
      return enterpriseColors.destructive;
    case 'REMINDER':
      return enterpriseColors.gray700;
    default:
      return enterpriseColors.primary;
  }
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'ACTION_REQUIRED':
    case 'ALERT':
      return AlertCircle;
    case 'REMINDER':
      return Bell;
    default:
      return Info;
  }
}

const FILTERS: { id: Filter; labelKey: string }[] = [
  { id: 'all', labelKey: 'notificationsCenter.filterAll' },
  { id: 'unread', labelKey: 'notificationsCenter.filterUnread' },
  { id: 'ACTION_REQUIRED', labelKey: 'notificationsCenter.filterActionRequired' },
  { id: 'REMINDER', labelKey: 'notificationsCenter.filterReminders' },
  { id: 'ALERT', labelKey: 'notificationsCenter.filterAlerts' },
];

/**
 * Shared notifications list (grower + buyer). Same API and actionUrl resolution as web NotificationCenter.
 */
export function NotificationsListScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const notifyRoles = normalizeUserRoles(user);
  const localeTag = useAppLocaleTag();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsAPI.getAll();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(producer)/(tabs)/profile');
    }
  };

  const subtitle =
    unreadCount > 0
      ? t('notificationsCenter.unreadCount', { count: unreadCount })
      : t('notificationsCenter.subtitle');

  const listBottomPad = Math.max(insets.bottom, 16) + 12;

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('notificationsCenter.title')} subtitle={subtitle} onBack={goBack} />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.72}
                style={[growerUi.filterChip, active && growerUi.filterChipOn]}
              >
                <Text style={[growerUi.filterChipText, active && growerUi.filterChipTextOn]}>{t(f.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[growerUi.scrollContent, { paddingBottom: listBottomPad }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={enterpriseColors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={enterpriseColors.primary} />
            <Text style={[enterpriseUi.navRowSubtitle, styles.loadingText]}>{t('notificationsCenter.loading')}</Text>
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={growerUi.emptyCard}>
            <Bell size={32} color={enterpriseColors.gray600} strokeWidth={1.5} />
            <Text style={[enterpriseUi.navRowSubtitle, styles.emptyText]}>{t('notificationsCenter.empty')}</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const iconColor = notificationIconColor(notification.type);

            return (
              <TouchableOpacity
                key={notification.id}
                onPress={() => {
                  if (!notification.read) {
                    void markAsRead(notification.id);
                  }
                  const href = resolveNotificationActionHref(notification.actionUrl, {
                    roles: notifyRoles,
                  });
                  if (href) {
                    router.push(href);
                  }
                }}
                activeOpacity={0.72}
                style={[
                  enterpriseUi.inAppPanel,
                  styles.item,
                  !notification.read && styles.itemUnread,
                ]}
              >
                <View style={styles.itemRow}>
                  <View style={styles.iconWell}>
                    <Icon size={20} color={iconColor} strokeWidth={1.5} />
                  </View>
                  <View style={styles.itemBody}>
                    <View style={styles.titleRow}>
                      <Text style={enterpriseUi.navRowTitle} numberOfLines={2}>
                        {notification.title}
                      </Text>
                      {!notification.read ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={enterpriseUi.navRowSubtitle} numberOfLines={3}>
                      {notification.message}
                    </Text>
                    <View style={styles.dateRow}>
                      <Calendar size={12} color={enterpriseColors.gray600} strokeWidth={1} />
                      <Text style={enterpriseUi.navRowSubtitle}>
                        {new Date(notification.createdAt).toLocaleDateString(localeTag, {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filterBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
  },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
  },
  item: {
    padding: 16,
    marginBottom: 10,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: enterpriseColors.primary,
    backgroundColor: enterpriseColors.primaryTint,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: enterpriseColors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: enterpriseColors.primary,
    marginTop: 6,
    flexShrink: 0,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
});
