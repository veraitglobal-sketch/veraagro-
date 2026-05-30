import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Store } from 'lucide-react-native';
import { enterpriseColors, enterpriseUi } from '../../../lib/enterprise-ui';
import { growerUi } from '../../../lib/grower-ui';
import { EnterpriseButton, EnterpriseTextArea } from '../../../design-system';
import { b2bSuppliersAPI } from '../../../lib/api';
import { apiErrorMessage } from '../../../lib/api-error';
import { useAuth } from '../../../hooks/useAuth';
import { partnerSignInHref } from '../../../lib/post-login-redirect';
import { useRouter, type Href } from 'expo-router';

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  sender: { firstName: string; lastName: string };
};

type Props = {
  supplierUserId: string;
  threadIdFromLink?: string;
  onOpenStore: () => void;
};

export function SupplierThreadPanel({ supplierUserId, threadIdFromLink, onOpenStore }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useAuth();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!supplierUserId || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let tid = threadIdFromLink?.trim() || '';
      if (!tid) {
        const thread = await b2bSuppliersAPI.getOrCreateThread(supplierUserId);
        tid = thread.id;
      }
      setThreadId(tid);
      const msgs = await b2bSuppliersAPI.getMessages(tid);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('b2bSupplier.sendFailed')));
    } finally {
      setLoading(false);
    }
  }, [supplierUserId, token, threadIdFromLink, t]);

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
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e: unknown) {
      Alert.alert(t('error'), apiErrorMessage(e, t('b2bSupplier.sendFailed')));
    } finally {
      setSending(false);
    }
  };

  if (!token) {
    return (
      <View style={[growerUi.scrollContent, styles.centered]}>
        <Text style={enterpriseUi.navRowSubtitle}>{t('b2bSupplier.signInBody')}</Text>
        <TouchableOpacity
          onPress={() => router.push(partnerSignInHref() as Href)}
          style={[enterpriseUi.authBtnPrimary, styles.signInBtn]}
          activeOpacity={0.88}
        >
          <Text style={enterpriseUi.authBtnPrimaryText}>{t('b2bSupplier.signInTitle')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TouchableOpacity onPress={onOpenStore} activeOpacity={0.72} style={[enterpriseUi.inAppPanel, styles.storeLink]}>
        <Store size={20} color={enterpriseColors.primary} strokeWidth={1.5} />
        <Text style={styles.storeLinkText}>{t('producer.dashboard.partnerOrders.openStore')}</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={enterpriseColors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[growerUi.scrollContent, { paddingBottom: 100 }]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((m) => (
            <View key={m.id} style={[enterpriseUi.inAppPanel, styles.msgBubble]}>
              <Text style={styles.msgAuthor}>
                {m.sender?.firstName} {m.sender?.lastName}
              </Text>
              <Text style={enterpriseUi.navRowTitle}>{m.body}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.composer}>
        <EnterpriseTextArea
          value={text}
          onChangeText={setText}
          placeholder={t('b2bSupplier.store.messagePlaceholder')}
          minRows={2}
          containerStyle={styles.composerField}
        />
        <EnterpriseButton
          label={t('b2bSupplier.store.sendMessage')}
          onPress={() => void send()}
          loading={sending}
          disabled={sending || !text.trim()}
          fullWidth
          size="large"
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  storeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
    padding: 14,
  },
  storeLinkText: {
    fontSize: 16,
    fontWeight: '500',
    color: enterpriseColors.primary,
  },
  msgBubble: {
    padding: 14,
    marginBottom: 10,
  },
  msgAuthor: {
    fontSize: 14,
    fontWeight: '500',
    color: enterpriseColors.gray600,
    marginBottom: 4,
  },
  composer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: enterpriseColors.gray200,
    backgroundColor: enterpriseColors.white,
  },
  composerField: {
    marginBottom: 10,
  },
  signInBtn: {
    marginTop: 16,
    minHeight: 48,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
});
