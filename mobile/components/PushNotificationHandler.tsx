import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { resolveNotificationActionHref } from '../lib/resolve-notification-action';
import { normalizeUserRoles } from '../lib/post-login-redirect';
import { refreshPushRegistrationIfAuthed } from '../lib/push-service';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Foreground display + tap navigation + token refresh on resume (authenticated).
 */
export function PushNotificationHandler() {
  const { user, token } = useAuth();
  const rolesRef = useRef<string[]>([]);

  useEffect(() => {
    rolesRef.current = normalizeUserRoles(user ?? undefined);
  }, [user]);

  useEffect(() => {
    if (Platform.OS === 'web' || !token || !user) return;

    void refreshPushRegistrationIfAuthed(rolesRef.current);

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refreshPushRegistrationIfAuthed(rolesRef.current);
      }
    });

    const openSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const actionUrl =
        typeof data.actionUrl === 'string'
          ? data.actionUrl
          : typeof data.action_url === 'string'
            ? data.action_url
            : undefined;
      const href = resolveNotificationActionHref(actionUrl, { roles: rolesRef.current });
      if (href) router.push(href);
    });

    return () => {
      sub.remove();
      openSub.remove();
    };
  }, [token, user?.id]);

  return null;
}
