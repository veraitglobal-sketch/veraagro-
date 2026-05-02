import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { b2bSuppliersAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../lib/theme';
import { ArrowLeft, MessageCircle, Package } from 'lucide-react-native';

type Msg = { id: string; body: string; createdAt: string; sender: { firstName: string; lastName: string } };

/**
 * Grower: contact material supplier (seeds, inputs) — thread + short direct order
 */
function paramFirst(raw: string | string[] | undefined): string | undefined {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw[0]) return raw[0];
  return undefined;
}

export default function B2bSupplierScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ userId: string; threadId?: string | string[] }>();
  const userId = paramFirst(params.userId) ?? '';
  const threadIdFromLink = paramFirst(params.threadId);
  const router = useRouter();
  const { token } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [orderLine, setOrderLine] = useState('');
  const [orderQty, setOrderQty] = useState('1');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const p = await b2bSuppliersAPI.getPublic(userId);
      setProfile(p);
      if (token) {
        let tid = threadIdFromLink?.trim() || '';
        if (!tid) {
          const thread = await b2bSuppliersAPI.getOrCreateThread(userId);
          tid = thread.id;
        }
        setThreadId(tid);
        const msgs = await b2bSuppliersAPI.getMessages(tid);
        setMessages(msgs);
      }
    } catch (e: any) {
      Alert.alert(t('error'), e?.response?.data?.message || e?.message || t('b2bSupplier.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [userId, token, t, threadIdFromLink]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!text.trim() || !threadId) return;
    setSending(true);
    try {
      await b2bSuppliersAPI.postMessage(threadId, text.trim());
      setText('');
      const msgs = await b2bSuppliersAPI.getMessages(threadId);
      setMessages(msgs);
    } catch (e: any) {
      Alert.alert(t('error'), e?.response?.data?.message || e?.message || t('b2bSupplier.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const placeOrder = async () => {
    if (!userId) return;
    const label = orderLine.trim() || 'Request quote';
    const qty = parseFloat(orderQty) || 1;
    if (!token) {
      Alert.alert(t('b2bSupplier.signInTitle'), t('b2bSupplier.signInBody'));
      return;
    }
    try {
      await b2bSuppliersAPI.createOrder({
        supplierUserId: userId,
        items: [{ label, quantity: qty, unit: 'order' }],
        note: 'Direct order from app',
        threadId: threadId || undefined,
      });
      Alert.alert(t('b2bSupplier.sentTitle'), t('b2bSupplier.sentBody'));
    } catch (e: any) {
      Alert.alert(t('error'), e?.response?.data?.message || e?.message || t('b2bSupplier.orderFailed'));
    }
  };

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ color: theme.colors.text.primary }}>Supplier not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: theme.colors.primary }}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          paddingTop: 56,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <ArrowLeft size={24} color={theme.colors.text.primary} strokeWidth={1.5} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text.primary }} numberOfLines={1}>
            {profile.businessName}
          </Text>
          <Text style={{ fontSize: 12, color: theme.colors.text.secondary }} numberOfLines={1}>
            {profile.city}, {profile.country}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Package size={18} color={theme.colors.primary} />
          <Text style={{ marginLeft: 8, fontSize: 15, fontWeight: '500', color: theme.colors.text.primary }}>
            Material supplier
          </Text>
        </View>
        {profile.description ? (
          <Text style={{ color: theme.colors.text.secondary, marginBottom: 12, lineHeight: 20 }}>{profile.description}</Text>
        ) : null}
        <Text style={{ color: theme.colors.text.tertiary, fontSize: 12 }}>{profile.address}</Text>

        {!token && (
          <View style={{ marginTop: 20, padding: 12, backgroundColor: '#FEF3C7', borderRadius: 8 }}>
            <Text style={{ color: '#92400E', fontSize: 13 }}>
              Sign in with your grower account to message and place orders.
            </Text>
            <TouchableOpacity onPress={() => router.push('/partner-login')} style={{ marginTop: 8 }}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        )}

        {token && (
          <>
            <View style={{ marginTop: 20, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
              <MessageCircle size={18} color={theme.colors.primary} />
              <Text style={{ marginLeft: 8, fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>
                Message
              </Text>
            </View>
            {messages.map((m) => {
              return (
                <View
                  key={m.id}
                  style={{
                    alignSelf: 'stretch',
                    marginBottom: 8,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: theme.colors.surface,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <Text style={{ fontSize: 11, color: theme.colors.text.tertiary, marginBottom: 4 }}>
                    {m.sender?.firstName} {m.sender?.lastName}
                  </Text>
                  <Text style={{ color: theme.colors.text.primary, fontSize: 14 }}>{m.body}</Text>
                </View>
              );
            })}

            <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Type a message…"
                placeholderTextColor={theme.colors.text.tertiary}
                multiline
                style={{
                  flex: 1,
                  minHeight: 44,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  color: theme.colors.text.primary,
                }}
              />
              <TouchableOpacity
                onPress={() => void send()}
                disabled={sending || !text.trim()}
                style={{
                  backgroundColor: theme.colors.primary,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  justifyContent: 'center',
                  opacity: sending || !text.trim() ? 0.5 : 1,
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 24, marginBottom: 8 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text.primary }}>Direct order</Text>
              <Text style={{ fontSize: 12, color: theme.colors.text.secondary, marginTop: 4 }}>
                Short request (e.g. seed type, boxes). Supplier confirms in their dashboard.
              </Text>
            </View>
            <TextInput
              value={orderLine}
              onChangeText={setOrderLine}
              placeholder="e.g. Raspberry seeds, 2 bags"
              placeholderTextColor={theme.colors.text.tertiary}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 10,
                marginBottom: 8,
                color: theme.colors.text.primary,
              }}
            />
            <TextInput
              value={orderQty}
              onChangeText={setOrderQty}
              keyboardType="decimal-pad"
              placeholder="Qty"
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: 8,
                padding: 10,
                marginBottom: 12,
                maxWidth: 100,
                color: theme.colors.text.primary,
              }}
            />
            <TouchableOpacity
              onPress={() => void placeOrder()}
              style={{ backgroundColor: '#C2410C', borderRadius: 8, padding: 14, alignItems: 'center' }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>Send order request</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
