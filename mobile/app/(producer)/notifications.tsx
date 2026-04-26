import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, AlertCircle, Info, Calendar } from 'lucide-react-native';
import { theme } from '../../lib/theme';
import { useBioVeraScreenPadding } from '../../lib/screen-insets';
import { notificationsAPI, Notification } from '../../lib/api';

/**
 * Notifications Screen
 * List of all notifications with filters
 * Matches buyer dashboard styling
 */
export default function NotificationsScreen() {
  const p = useBioVeraScreenPadding();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'all') return true;
    return n.type === filter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ACTION_REQUIRED': return AlertCircle;
      case 'REMINDER': return Bell;
      case 'ALERT': return AlertCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'ACTION_REQUIRED': return theme.colors.error;
      case 'REMINDER': return theme.colors.warning;
      case 'ALERT': return theme.colors.error;
      default: return theme.colors.primary;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: p.headerTop,
        paddingBottom: theme.spacing.md,
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{ marginRight: theme.spacing.md }}
        >
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <Text style={{
          fontSize: 18,
          fontWeight: '300',
          color: theme.colors.text.primary,
          letterSpacing: 0.5,
          flex: 1,
        }}>
          Notifications
        </Text>
        {notifications.filter(n => !n.read).length > 0 && (
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.colors.error,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text style={{
              fontSize: 9,
              fontWeight: '300',
              color: theme.colors.background,
            }}>
              {notifications.filter(n => !n.read).length}
            </Text>
          </View>
        )}
      </View>

      {/* Filters */}
      <View style={{
        paddingLeft: p.screenPaddingLeft,
        paddingRight: p.screenPaddingRight,
        paddingVertical: theme.spacing.sm,
        backgroundColor: theme.colors.background,
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(0, 0, 0, 0.08)',
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
            {[
              { id: 'all' as const, label: 'All' },
              { id: 'unread' as const, label: 'Unread' },
              { id: 'ACTION_REQUIRED' as const, label: 'Action Required' },
              { id: 'REMINDER' as const, label: 'Reminders' },
              { id: 'ALERT' as const, label: 'Alerts' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => setFilter(f.id)}
                activeOpacity={0.7}
                style={{
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                  borderWidth: 0.5,
                  borderColor: filter === f.id ? theme.colors.primary : 'rgba(0, 0, 0, 0.05)',
                  backgroundColor: filter === f.id ? `${theme.colors.primary}10` : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 11,
                  fontWeight: '300',
                  color: filter === f.id ? theme.colors.primary : theme.colors.text.secondary,
                  letterSpacing: 0.3,
                }}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View
          style={{
            paddingTop: theme.spacing.md,
            paddingLeft: p.screenPaddingLeft,
            paddingRight: p.screenPaddingRight,
            paddingBottom: Math.max(p.bottomInset, theme.spacing.lg),
          }}
        >
          {loading ? (
            <View style={{ padding: theme.spacing.xl, alignItems: 'center' }}>
              <Text style={{
                color: theme.colors.text.secondary,
                fontSize: 11,
                fontWeight: '300',
                letterSpacing: 0.3,
              }}>
                Loading...
              </Text>
            </View>
          ) : filteredNotifications.length === 0 ? (
            <View style={{
              backgroundColor: theme.colors.surface,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.xl,
              borderWidth: 0.5,
              borderColor: 'rgba(0, 0, 0, 0.05)',
              alignItems: 'center',
            }}>
              <Bell size={32} color={theme.colors.text.tertiary} strokeWidth={1} />
              <Text style={{
                fontSize: 11,
                fontWeight: '300',
                color: theme.colors.text.secondary,
                marginTop: theme.spacing.sm,
                letterSpacing: 0.3,
                textAlign: 'center',
              }}>
                No Notifications
              </Text>
            </View>
          ) : (
            <View style={{ gap: theme.spacing.sm }}>
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification.type);
                const iconColor = getNotificationColor(notification.type);
                
                return (
                  <TouchableOpacity
                    key={notification.id}
                    onPress={() => {
                      if (!notification.read) {
                        markAsRead(notification.id);
                      }
                      if (notification.actionUrl) {
                        router.push(notification.actionUrl);
                      }
                    }}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: notification.read ? theme.colors.surface : `${iconColor}05`,
                      borderRadius: theme.borderRadius.md,
                      padding: theme.spacing.md,
                      borderWidth: 0.5,
                      borderColor: notification.read ? 'rgba(0, 0, 0, 0.05)' : iconColor,
                      borderLeftWidth: notification.read ? 0.5 : 3,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: theme.borderRadius.sm,
                        backgroundColor: `${iconColor}15`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: theme.spacing.sm,
                      }}>
                        <Icon size={20} color={iconColor} strokeWidth={1} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.xs }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: notification.read ? '300' : '400',
                            color: theme.colors.text.primary,
                            letterSpacing: 0.3,
                            flex: 1,
                          }}>
                            {notification.title}
                          </Text>
                          {!notification.read && (
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: iconColor,
                              marginLeft: theme.spacing.sm,
                            }} />
                          )}
                        </View>
                        <Text style={{
                          fontSize: 11,
                          fontWeight: '300',
                          color: theme.colors.text.secondary,
                          marginBottom: theme.spacing.xs,
                          letterSpacing: 0.2,
                        }}>
                          {notification.message}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Calendar size={11} color={theme.colors.text.secondary} strokeWidth={1} />
                          <Text style={{
                            fontSize: 9,
                            fontWeight: '300',
                            color: theme.colors.text.secondary,
                            marginLeft: 4,
                            letterSpacing: 0.2,
                          }}>
                            {new Date(notification.createdAt).toLocaleDateString('en-US', {
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
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
