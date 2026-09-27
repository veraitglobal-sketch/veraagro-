import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { MessageSquare, Send, ChevronLeft } from 'lucide-react-native';
import { b2bSuppliersAPI } from '../../lib/api';
import { apiErrorMessage } from '../../lib/api-error';
import { enterpriseColors, enterpriseUi } from '../../lib/enterprise-ui';
import { useAppLocaleTag } from '../../lib/date-locale';
import { useAuth } from '../../hooks/useAuth';
import EmptyState from '../../components/EmptyState';

type Thread = {
  id: string;
  lastMessageAt?: string | null;
  farmer?: { firstName?: string | null; lastName?: string | null; partnerCode?: string | null } | null;
};
type Message = { id: string; senderId: string; body: string; createdAt: string };

function initials(thread: Thread) {
  const f = thread.farmer;
  const s = [f?.firstName, f?.lastName].map((n) => (n || '').trim().charAt(0).toUpperCase()).join('');
  return s || '?';
}

export default function SupplierMessagesScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigation = useNavigation();
  const dateLocale = useAppLocaleTag();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const name = (th: Thread) =>
    th.farmer
      ? `${th.farmer.firstName || ''} ${th.farmer.lastName || ''}`.trim() || th.farmer.partnerCode || t('supplier.growerFallback')
      : t('supplier.threadUntitledShort', { id: th.id.replace(/-/g, '').slice(0, 8) });

  const loadThreads = useCallback(async () => {
    try {
      const data = await b2bSuppliersAPI.getMyThreads();
      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadThreads();
    }, [loadThreads]),
  );

  const openThread = async (th: Thread) => {
    setActive(th);
    navigation.setOptions({ title: name(th) });
    try {
      const m = await b2bSuppliersAPI.getThreadMessages(th.id);
      setMessages(Array.isArray(m) ? m : []);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: false }));
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.loadFailed')));
    }
  };

  const closeThread = () => {
    setActive(null);
    setMessages([]);
    navigation.setOptions({ title: t('supplier.screenMessages') });
  };

  const send = async () => {
    if (!active || !text.trim()) return;
    setSending(true);
    try {
      await b2bSuppliersAPI.postMessage(active.id, text.trim());
      setText('');
      setMessages((await b2bSuppliersAPI.getThreadMessages(active.id)) || []);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
      void loadThreads();
    } catch (e) {
      Alert.alert(t('error'), apiErrorMessage(e, t('supplier.sendFailed')));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={enterpriseColors.primary} />
      </View>
    );
  }

  if (!active) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await loadThreads();
              setRefreshing(false);
            }}
            tintColor={enterpriseColors.primary}
          />
        }
      >
        {threads.length === 0 ? (
          <EmptyState message={t('supplier.dashboard.noThreads')} icon={MessageSquare} />
        ) : (
          <View style={styles.panel}>
            {threads.map((th, i) => (
              <TouchableOpacity
                key={th.id}
                onPress={() => void openThread(th)}
                activeOpacity={0.6}
                style={styles.threadRow}
                accessibilityRole="button"
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials(th)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.threadName} numberOfLines={1}>{name(th)}</Text>
                  <Text style={styles.threadMeta} numberOfLines={1}>
                    {[th.farmer?.partnerCode, th.lastMessageAt ? new Date(th.lastMessageAt).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                {i < threads.length - 1 ? <View style={styles.divider} /> : null}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TouchableOpacity onPress={closeThread} style={styles.back} accessibilityRole="button">
        <ChevronLeft size={16} color={enterpriseColors.primary} strokeWidth={2.2} />
        <Text style={styles.backText}>{t('supplier.dashboard.allThreads')}</Text>
      </TouchableOpacity>
      <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={styles.chat} keyboardShouldPersistTaps="handled">
        {messages.map((m) => {
          const mine = m.senderId === user?.id;
          return (
            <View key={m.id} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                <Text style={[styles.bubbleText, mine && { color: '#fff' }]}>{m.body}</Text>
                <Text style={[styles.bubbleTime, mine && { color: 'rgba(255,255,255,0.7)' }]}>
                  {new Date(m.createdAt).toLocaleString(dateLocale, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={t('supplier.replyPlaceholder')}
          placeholderTextColor={enterpriseColors.gray600}
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          onPress={() => void send()}
          disabled={sending || !text.trim()}
          style={[styles.sendBtn, (sending || !text.trim()) && { opacity: 0.45 }]}
          accessibilityRole="button"
          accessibilityLabel={t('supplier.send')}
        >
          {sending ? <ActivityIndicator color="#fff" /> : <Send size={17} color="#fff" strokeWidth={2} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: enterpriseColors.canvas },
  center: { flex: 1, justifyContent: 'center', backgroundColor: enterpriseColors.canvas },
  listContent: { padding: 16, paddingBottom: 40 },
  panel: { ...enterpriseUi.inAppPanel },
  threadRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F1E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: '700', color: enterpriseColors.primary },
  threadName: { fontSize: 15, fontWeight: '600', letterSpacing: -0.25, color: enterpriseColors.gray900 },
  threadMeta: { fontSize: 12, color: enterpriseColors.gray600, marginTop: 2 },
  divider: {
    position: 'absolute',
    left: 66,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: enterpriseColors.gray200,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 14, paddingVertical: 10 },
  backText: { fontSize: 13.5, fontWeight: '600', color: enterpriseColors.primary },
  chat: { paddingHorizontal: 14, paddingBottom: 12, gap: 6 },
  bubbleRow: { flexDirection: 'row' },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: enterpriseColors.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: enterpriseColors.white,
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.1)',
  },
  bubbleText: { fontSize: 14.5, lineHeight: 20, color: enterpriseColors.gray900 },
  bubbleTime: { fontSize: 10.5, color: enterpriseColors.gray600, marginTop: 3, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.canvas,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 110,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: enterpriseColors.gray900,
    backgroundColor: enterpriseColors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(17, 24, 39, 0.14)',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: enterpriseColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
