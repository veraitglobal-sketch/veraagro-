import { View, Text, ScrollView, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState, useEffect, useMemo } from 'react';
import { Bell, AlertCircle, Info, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GrowerStackHeader } from '../../../components/grower/GrowerStackHeader';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { notificationsAPI, Notification } from '../../../lib/api';
import { normalizeUserRoles, getPostLoginPath } from '../../../lib/post-login-redirect';
import { resolveNotificationActionHref } from '../../../lib/resolve-notification-action';
import { useAuth } from '../../../hooks/useAuth';
import { useAppLocaleTag } from '../../../lib/date-locale';
import EmptyState from '../../../components/EmptyState';

type Filter = 'all' | 'unread' | 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT';

type Tone = { bg: string; fg: string; label: string };

function notificationTone(type: string): Tone {
  switch (type) {
    case 'ACTION_REQUIRED':
      return { bg: '#F6EDDA', fg: '#8A5D0F', label: 'notificationsCenter.filterActionRequired' };
    case 'ALERT':
      return { bg: '#FBE9E7', fg: '#B42318', label: 'notificationsCenter.filterAlerts' };
    case 'REMINDER':
      return { bg: '#E1EFEC', fg: '#1D665D', label: 'notificationsCenter.filterReminders' };
    default:
      return { bg: '#E8F1E4', fg: '#2D5A27', label: '' };
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

/** "MISSION-2026-0015-D0F3: zahtev nije odobren" → code chip + readable text. */
function splitReference(message: string): { code: string | null; text: string } {
  const m = /^([A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+):\s*([\s\S]*)$/.exec(message ?? '');
  if (!m) return { code: null, text: message ?? '' };
  const text = m[2].charAt(0).toLocaleUpperCase() + m[2].slice(1);
  return { code: m[1], text };
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
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

  const groups = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const sorted = [...filteredNotifications].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const out: { key: string; label: string; items: Notification[] }[] = [];
    for (const n of sorted) {
      const d = new Date(n.createdAt);
      const key = dayKey(d);
      let group = out[out.length - 1];
      if (!group || group.key !== key) {
        const label =
          key === dayKey(today)
            ? t('notificationsCenter.today')
            : key === dayKey(yesterday)
              ? t('notificationsCenter.yesterday')
              : d.toLocaleDateString(localeTag, { day: 'numeric', month: 'long', year: 'numeric' });
        group = { key, label, items: [] };
        out.push(group);
      }
      group.items.push(n);
    }
    return out;
  }, [filteredNotifications, localeTag, t]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace((getPostLoginPath(notifyRoles) || '/login') as never);
    }
  };

  const subtitle =
    unreadCount > 0
      ? t('notificationsCenter.unreadCount', { count: unreadCount })
      : t('notificationsCenter.subtitle');

  const listBottomPad = Math.max(insets.bottom, 16) + 12;

  return (
    <View style={growerUi.canvas}>
      <GrowerStackHeader title={t('producer.liveInfo.notifications')} subtitle={subtitle} onBack={goBack} />

      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const showCount = f.id === 'unread' && unreadCount > 0;
            return (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.chip, active && styles.chipOn]}
              >
                <Text style={[styles.chipText, active && styles.chipTextOn]}>{t(f.labelKey)}</Text>
                {showCount ? (
                  <View style={[styles.chipCount, active && styles.chipCountOn]}>
                    <Text style={[styles.chipCountText, active && styles.chipCountTextOn]}>{unreadCount}</Text>
                  </View>
                ) : null}
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
          <EmptyState message={t('producer.notifications.empty')} icon={Bell} />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              <View style={styles.groupPanel}>
                {group.items.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const tone = notificationTone(notification.type);
                  const { code, text } = splitReference(notification.message);
                  const href = resolveNotificationActionHref(notification.actionUrl, {
                    roles: notifyRoles,
                  });
                  const time = new Date(notification.createdAt).toLocaleTimeString(localeTag, {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity
                      key={notification.id}
                      activeOpacity={0.6}
                      onPress={() => {
                        if (!notification.read) {
                          void markAsRead(notification.id);
                        }
                        if (href) {
                          router.push(href);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${notification.title}. ${notification.message}`}
                      style={styles.item}
                    >
                      <View style={[styles.iconWell, { backgroundColor: tone.bg }]}>
                        <Icon size={17} color={tone.fg} strokeWidth={1.9} />
                      </View>
                      <View style={styles.itemBody}>
                        <View style={styles.titleRow}>
                          <Text
                            style={[styles.title, !notification.read && styles.titleUnread]}
                            numberOfLines={2}
                          >
                            {notification.title}
                          </Text>
                          <Text style={styles.time}>{time}</Text>
                        </View>
                        <Text style={styles.message} numberOfLines={3}>
                          {text}
                        </Text>
                        {code || tone.label ? (
                          <View style={styles.metaRow}>
                            {tone.label ? (
                              <View style={[styles.typePill, { backgroundColor: tone.bg }]}>
                                <Text style={[styles.typePillText, { color: tone.fg }]}>{t(tone.label)}</Text>
                              </View>
                            ) : null}
                            {code ? (
                              <View style={styles.codeChip}>
                                <Text style={styles.codeText} numberOfLines={1}>
                                  {code}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.trail}>
                        {!notification.read ? <View style={styles.unreadDot} /> : null}
                        {href ? <ChevronRight size={16} color={enterpriseColors.gray600} strokeWidth={2} /> : null}
                      </View>
                      {index < group.items.length - 1 ? <View style={styles.divider} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filterBar: {
    paddingBottom: 12,
    backgroundColor: enterpriseColors.canvas,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: enterpriseColors.white,
    borderWidth: 1,
    borderColor: 'rgba(17, 24, 39, 0.08)',
  },
  chipOn: {
    backgroundColor: '#1F3D1B',
    borderColor: '#1F3D1B',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: enterpriseColors.gray700,
    letterSpacing: -0.15,
  },
  chipTextOn: {
    color: '#fff',
  },
  chipCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountOn: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  chipCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  chipCountTextOn: {
    color: '#fff',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 4,
  },
  group: {
    marginBottom: 18,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7A67',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupPanel: {
    ...enterpriseUi.inAppPanel,
    borderRadius: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 14,
    paddingLeft: 14,
    paddingRight: 12,
  },
  iconWell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: enterpriseColors.gray900,
    letterSpacing: -0.25,
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12.5,
    color: enterpriseColors.gray600,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: 13,
    color: enterpriseColors.gray600,
    lineHeight: 18,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  codeChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: enterpriseColors.gray100,
    maxWidth: '100%',
  },
  codeText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: enterpriseColors.gray700,
    fontFamily: 'Menlo',
    letterSpacing: -0.2,
  },
  trail: {
    alignItems: 'center',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingTop: 4,
    gap: 8,
    minWidth: 16,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#2D5A27',
  },
  divider: {
    position: 'absolute',
    left: 60,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.gray200,
  },
});
