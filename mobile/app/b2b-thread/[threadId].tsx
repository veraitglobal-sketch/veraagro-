import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';
import { partnerSignInHref } from '../../lib/post-login-redirect';
import { useAuth } from '../../hooks/useAuth';

function paramId(raw: string | string[] | undefined): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return '';
}

/**
 * Resolves a web-style grower thread URL (`/grower/where-to-buy/thread/:id`) to the
 * supplier chat screen (`/b2b-supplier/:userId?threadId=`) — same thread as on web.
 */
export default function B2bThreadDeepLinkScreen() {
  const { threadId: threadIdRaw } = useLocalSearchParams<{ threadId: string }>();
  const threadId = paramId(threadIdRaw);
  const router = useRouter();
  const { t } = useTranslation();
  const { token } = useAuth();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!threadId.trim()) {
      setErr(t('producer.dashboard.partnerOrders.threadDeepLinkMissing'));
      return;
    }
    if (!token) {
      router.replace(partnerSignInHref() as any);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const threads = await b2bSuppliersAPI.getMyThreadsAsFarmer();
        const row = Array.isArray(threads)
          ? (threads as { id: string; supplierUserId: string }[]).find((x) => x.id === threadId)
          : undefined;
        if (cancelled) return;
        if (!row?.supplierUserId) {
          setErr(t('producer.dashboard.partnerOrders.threadNotFound'));
          return;
        }
        const next =
          `/b2b-supplier/${encodeURIComponent(row.supplierUserId)}?threadId=${encodeURIComponent(threadId)}`;
        router.replace(next as Href);
      } catch {
        if (!cancelled) {
          setErr(t('producer.dashboard.partnerOrders.loadFailed'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threadId, token, router, t]);

  if (err) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text.primary, textAlign: 'center', marginBottom: 16 }}>{err}</Text>
        <TouchableOpacity onPress={() => router.replace('/(producer)/partner-orders')}>
          <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
            {t('producer.dashboard.partnerOrders.openPartnerOrdersList')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
      <ActivityIndicator color={theme.colors.primary} size="large" />
    </View>
  );
}
