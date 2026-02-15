/**
 * Vera AI Chatbot / Intelligence Terminal – mobilna verzija
 * Us klađeno sa web komponentom: ticker, kategorije, chat, #2D5A27.
 */
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  StyleSheet,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {
  MessageCircle,
  X,
  Send,
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Zap,
  Search,
  ArrowLeft,
  ShoppingBag,
  Leaf,
  Building2,
  Route,
  Calculator,
  Calendar,
  QrCode,
  Mail,
  FileCheck,
  Award,
  BookOpen,
  UserPlus,
} from 'lucide-react-native';
import { colors, VERA_GREEN } from '../lib/colors';
import { aiAssistantApi } from '../lib/api';

const SITE_URL = process.env.EXPO_PUBLIC_SITE_URL || 'https://biovera.app';

type CategoryKey = 'buyers' | 'growers' | 'logistics' | 'suppliers';

const CATEGORY_BUTTONS: { key: CategoryKey; label: string; Icon: typeof ShoppingBag }[] = [
  { key: 'buyers', label: 'For Buyers', Icon: ShoppingBag },
  { key: 'growers', label: 'For Growers', Icon: Leaf },
  { key: 'logistics', label: 'For Logistics', Icon: Truck },
  { key: 'suppliers', label: 'For Suppliers', Icon: Building2 },
];

const CATEGORY_PANELS: Record<
  CategoryKey,
  { title: string; ctaLabel: string; href: string; actions: { label: string; Icon: typeof Package }[] }
> = {
  logistics: {
    title: 'Logistics analytics',
    ctaLabel: 'For Logistics',
    href: '/logistics-partner',
    actions: [
      { label: 'Load Optimization', Icon: Package },
      { label: 'Route Efficiency', Icon: Route },
      { label: 'Packaging Integrity', Icon: Package },
      { label: 'Cost Analysis', Icon: Calculator },
    ],
  },
  buyers: {
    title: 'For Buyers',
    ctaLabel: 'Browse Products',
    href: '/for-buyers',
    actions: [
      { label: 'Browse Products', Icon: ShoppingBag },
      { label: 'Pre-order', Icon: Calendar },
      { label: 'Traceability', Icon: QrCode },
      { label: 'Contact Sales', Icon: Mail },
    ],
  },
  growers: {
    title: 'For Growers',
    ctaLabel: 'For Growers',
    href: '/growers',
    actions: [
      { label: 'Apply as Producer', Icon: FileCheck },
      { label: 'Certification', Icon: Award },
      { label: 'Resources', Icon: BookOpen },
      { label: 'Contact', Icon: Mail },
    ],
  },
  suppliers: {
    title: 'For Suppliers',
    ctaLabel: 'For Suppliers',
    href: '/suppliers',
    actions: [
      { label: 'Join Network', Icon: UserPlus },
      { label: 'Products', Icon: Package },
      { label: 'Regions', Icon: MapPin },
      { label: 'Contact', Icon: Mail },
    ],
  },
};

const CITIES = ['Hamburg', 'Vienna', 'Munich', 'Berlin', 'Zagreb', 'Ljubljana'];

function useTicker() {
  const [ticker, setTicker] = useState({ newOrders: 6, inTransit: 8, toHamburg: 3, delivered: 78 });
  const [newOrder, setNewOrder] = useState<{ qty: number; city: string } | null>(null);
  const ref = useRef(ticker);

  useEffect(() => {
    ref.current = ticker;
  }, [ticker]);

  useEffect(() => {
    const intervalMs = 20000 + Math.random() * 25000;
    const id = setInterval(() => {
      const t = ref.current;
      const r = Math.random();
      if (r > 0.75) {
        setTicker((prev) => ({
          ...prev,
          newOrders: Math.min(15, prev.newOrders + 1),
          inTransit: Math.min(10, prev.inTransit + 1),
        }));
      } else if (r > 0.5) {
        setTicker((prev) => ({
          ...prev,
          inTransit: Math.max(6, prev.inTransit - 1),
          toHamburg: Math.min(5, prev.toHamburg + 1),
        }));
      } else if (r > 0.25) {
        setTicker((prev) => ({
          ...prev,
          toHamburg: Math.max(1, prev.toHamburg - 1),
          delivered: Math.min(88, prev.delivered + 1),
        }));
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setNewOrder({
        qty: [24, 48, 80, 120][Math.floor(Math.random() * 4)],
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
      });
      setTimeout(() => setNewOrder(null), 4000 + Math.random() * 4000);
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(id);
  }, []);

  return { ...ticker, newOrder };
}

type MessageItem = { role: 'user' | 'assistant'; content: string };

const LOADING_PLACEHOLDER = '\u00A0';

export default function VeraAIChatbot() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'main' | CategoryKey>('main');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const ticker = useTicker();
  const { width } = useWindowDimensions();

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const sendQuery = async (query: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'assistant', content: LOADING_PLACEHOLDER }]);
    try {
      const data = await aiAssistantApi.query(query, { language: 'en', sessionId });
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) =>
        prev.map((m) =>
          m.role === 'assistant' && m.content === LOADING_PLACEHOLDER
            ? { role: 'assistant' as const, content: data.answer }
            : m
        )
      );
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Cannot reach the assistant. Check your connection and try again.';
      setMessages((prev) =>
        prev.map((m) =>
          m.role === 'assistant' && m.content === LOADING_PLACEHOLDER
            ? { role: 'assistant' as const, content: errorMessage }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!message.trim() || loading) return;
    const q = message.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setMessage('');
    sendQuery(q);
  };

  const handleCategorySelect = (key: CategoryKey) => setView(key);
  const handlePanelAction = (label: string) => {
    if (loading) return;
    setMessages((prev) => [...prev, { role: 'user', content: label }]);
    sendQuery(label);
  };

  const handleCta = (href: string) => {
    setOpen(false);
    const url = href.startsWith('http') ? href : `${SITE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
    Linking.openURL(url);
  };

  const openWhatsApp = () => Linking.openURL('https://wa.me/381601234567');

  const modalWidth = Math.min(350, width - 24);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        style={[styles.fab, { right: 16, bottom: 24 }]}
      >
        <MessageCircle size={20} color={VERA_GREEN} strokeWidth={2} />
        <Text style={styles.fabLabel}>Need help?</Text>
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={[styles.modalBox, { width: modalWidth, maxWidth: width - 24 }]}
          >
            {/* Ticker */}
            <View style={styles.ticker}>
              <View style={styles.tickerRow}>
                <View style={styles.tickerCell}>
                  <Package size={14} color={VERA_GREEN} />
                  <Text style={styles.tickerValue}>{ticker.newOrders}</Text>
                  <Text style={styles.tickerLabel}>New</Text>
                </View>
                <View style={styles.tickerCell}>
                  <Truck size={14} color={VERA_GREEN} />
                  <Text style={styles.tickerValue}>{ticker.inTransit}</Text>
                  <Text style={styles.tickerLabel}>Transit</Text>
                </View>
                <View style={styles.tickerCell}>
                  <MapPin size={14} color={VERA_GREEN} />
                  <Text style={styles.tickerValue}>{ticker.toHamburg}</Text>
                  <Text style={styles.tickerLabel}>→ Hamburg</Text>
                </View>
                <View style={styles.tickerCell}>
                  <CheckCircle size={14} color={VERA_GREEN} />
                  <Text style={[styles.tickerValue, { color: VERA_GREEN }]}>{ticker.delivered}%</Text>
                  <Text style={styles.tickerLabel}>Done</Text>
                </View>
              </View>
              {ticker.newOrder && (
                <Text style={styles.newOrderText}>
                  New order: {ticker.newOrder.qty} boxes → {ticker.newOrder.city}
                </Text>
              )}
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>INTELLIGENCE TERMINAL</Text>
                <Text style={styles.headerSubtitle}>Logistics Analytics v2.1</Text>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity onPress={openWhatsApp} style={styles.headerBtn}>
                  <Zap size={20} color={colors.text.secondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.headerBtn}>
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Categories or panel */}
            <View style={styles.categoriesSection}>
              {view === 'main' ? (
                <View style={styles.categoryGrid}>
                  {CATEGORY_BUTTONS.map(({ key, label, Icon }) => (
                    <TouchableOpacity
                      key={key}
                      style={styles.categoryBtn}
                      onPress={() => handleCategorySelect(key)}
                    >
                      <Icon size={16} color={VERA_GREEN} />
                      <Text style={styles.categoryBtnText}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.panel}>
                  <TouchableOpacity style={styles.backBtn} onPress={() => setView('main')}>
                    <ArrowLeft size={16} color={colors.text.secondary} />
                    <Text style={styles.backBtnText}>Back</Text>
                  </TouchableOpacity>
                  <Text style={styles.panelTitle}>{CATEGORY_PANELS[view].title}</Text>
                  <View style={styles.categoryGrid}>
                    {CATEGORY_PANELS[view].actions.map(({ label, Icon }) => (
                      <TouchableOpacity
                        key={label}
                        style={styles.categoryBtn}
                        onPress={() => handlePanelAction(label)}
                      >
                        <Icon size={16} color={VERA_GREEN} />
                        <Text style={styles.categoryBtnText}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={styles.ctaBtn}
                    onPress={() => handleCta(CATEGORY_PANELS[view].href)}
                  >
                    <Text style={styles.ctaBtnText}>{CATEGORY_PANELS[view].ctaLabel}</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 && (
                <Text style={styles.messagesEmpty}>
                  Click a category above or ask any question here.
                </Text>
              )}
              {messages.map((m, i) => (
                <View
                  key={i}
                  style={[
                    styles.messageBubble,
                    m.role === 'user' ? styles.messageUser : styles.messageAssistant,
                  ]}
                >
                  {m.content === LOADING_PLACEHOLDER ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator size="small" color={VERA_GREEN} />
                    <Text style={styles.messageAssistantText}>Loading...</Text>
                  </View>
                ) : (
                  <Text style={m.role === 'user' ? styles.messageUserText : styles.messageAssistantText}>
                    {m.content}
                  </Text>
                )}
                </View>
              ))}
            </ScrollView>

            {/* Input */}
            <View style={styles.inputRow}>
              <View style={styles.inputWrap}>
                <Search size={16} color={colors.text.tertiary} style={styles.inputIcon} />
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Ask anything else..."
                  placeholderTextColor={colors.text.tertiary}
                  style={styles.input}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                />
              </View>
              <TouchableOpacity
                style={[styles.sendBtn, loading && { opacity: 0.6 }]}
                onPress={handleSend}
                disabled={loading}
              >
                <Send size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.3)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  fabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: VERA_GREEN,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalBox: {
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45, 90, 39, 0.2)',
  },
  ticker: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 90, 39, 0.15)',
    backgroundColor: 'rgba(45, 90, 39, 0.08)',
  },
  tickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tickerCell: {
    alignItems: 'center',
  },
  tickerValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
  },
  tickerLabel: {
    fontSize: 9,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  newOrderText: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: '600',
    color: VERA_GREEN,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'rgba(45, 90, 39, 0.06)',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: VERA_GREEN,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  headerBtn: {
    padding: 8,
  },
  categoriesSection: {
    minHeight: 120,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '47%',
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
    flex: 1,
  },
  panel: {
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.secondary,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  ctaBtn: {
    backgroundColor: VERA_GREEN,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  messagesScroll: {
    flex: 1,
    minHeight: 120,
    maxHeight: 220,
  },
  messagesContent: {
    padding: 12,
    paddingBottom: 8,
  },
  messagesEmpty: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.text.secondary,
    paddingVertical: 16,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '90%',
  },
  messageUser: {
    alignSelf: 'flex-end',
    backgroundColor: VERA_GREEN,
  },
  messageAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageUserText: {
    fontSize: 13,
    color: '#fff',
  },
  messageAssistantText: {
    fontSize: 13,
    color: colors.text.primary,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  inputIcon: {
    position: 'absolute',
    left: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingLeft: 32,
    paddingRight: 8,
    fontSize: 14,
    color: colors.text.primary,
  },
  sendBtn: {
    backgroundColor: VERA_GREEN,
    padding: 12,
    borderRadius: 10,
  },
});
