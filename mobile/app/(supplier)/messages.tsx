import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { b2bSuppliersAPI } from '../../lib/api';
import { theme } from '../../lib/theme';
import { useAppLocaleTag } from '../../lib/date-locale';

export default function SupplierMessagesScreen() {
  const { t } = useTranslation();
  const [threads, setThreads] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const dateLocale = useAppLocaleTag();

  const fmt = (iso: string | undefined) =>
    iso ? new Date(iso).toLocaleString(dateLocale) : '';

  const loadThreads = async () => {
    try {
      const data = await b2bSuppliersAPI.getMyThreads();
      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('supplier.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThreads();
  }, []);

  const openThread = async (id: string) => {
    setActiveId(id);
    try {
      const m = await b2bSuppliersAPI.getThreadMessages(id);
      setMessages(Array.isArray(m) ? m : []);
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('supplier.loadFailed'));
    }
  };

  const send = async () => {
    if (!activeId || !text.trim()) return;
    setSending(true);
    try {
      await b2bSuppliersAPI.postMessage(activeId, text.trim());
      setText('');
      setMessages((await b2bSuppliersAPI.getThreadMessages(activeId)) || []);
      await loadThreads();
    } catch (e) {
      Alert.alert(t('error'), e instanceof Error ? e.message : t('supplier.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <ScrollView style={{ width: '38%', maxWidth: 200, borderRightWidth: 1, borderColor: theme.colors.border }}>
          {threads.map((thread) => (
            <TouchableOpacity
              key={thread.id}
              onPress={() => void openThread(thread.id)}
              style={{
                padding: 12,
                backgroundColor: activeId === thread.id ? theme.colors.primaryLight : 'transparent',
              }}
            >
              <Text style={{ fontSize: 12, color: theme.colors.text.primary }} numberOfLines={2}>
                {thread.farmer
                  ? `${thread.farmer.firstName || ''} ${thread.farmer.lastName || ''}\n${thread.farmer.partnerCode || ''}`
                  : t('supplier.threadUntitledShort', {
                      id: String(thread.id).replace(/-/g, '').slice(0, 8),
                    })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={{ flex: 1, padding: 8 }}>
          {!activeId ? (
            <Text style={{ color: theme.colors.text.secondary, textAlign: 'center', marginTop: 32 }}>{t('supplier.selectThread')}</Text>
          ) : (
            <>
              <ScrollView style={{ flex: 1, marginBottom: 8 }} keyboardShouldPersistTaps="handled">
                {messages.map((m) => (
                  <View key={m.id} style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: theme.colors.text.primary }}>{m.body}</Text>
                    <Text style={{ fontSize: 10, color: theme.colors.text.tertiary, marginTop: 2 }}>
                      {fmt(m.createdAt)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder={t('supplier.replyPlaceholder')}
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 14,
                    maxHeight: 100,
                  }}
                  multiline
                />
                <TouchableOpacity
                  onPress={() => void send()}
                  disabled={sending}
                  style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 }}
                >
                  <Text style={{ color: '#fff' }}>{t('supplier.send')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
