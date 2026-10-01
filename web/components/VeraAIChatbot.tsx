'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { X, Send, MessageCircle, Zap, Package, Route, Calculator, Search, ShoppingBag, Leaf, Truck, Building2, Calendar, QrCode, Mail, FileCheck, Award, BookOpen, UserPlus, MapPin, CheckCircle, ArrowLeft, CalendarDays } from 'lucide-react';
import { useBookCallHref } from '@/hooks/useBookCallHref';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const VERA_GREEN = '#2D5A27';

type CategoryKey = 'buyers' | 'growers' | 'logistics' | 'suppliers';

type PanelActionDef = { actionKey: string; icon: React.ComponentType<{ className?: string }> };

/** Actions shown per category; labels via `t(actionKey)`. AI receives the same translated label + UI locale so replies match the user's language. */
const CATEGORY_PANEL_DEFS: Record<CategoryKey, { href: string; actions: PanelActionDef[] }> = {
  logistics: {
    href: '/logistics-partner',
    actions: [
      { actionKey: 'chat.terminal.actionLoadOptimization', icon: Package },
      { actionKey: 'chat.terminal.actionRouteEfficiency', icon: Route },
      { actionKey: 'chat.terminal.actionPackagingIntegrity', icon: Package },
      { actionKey: 'chat.terminal.actionCostAnalysis', icon: Calculator },
    ],
  },
  buyers: {
    href: '/for-buyers',
    actions: [
      { actionKey: 'chat.terminal.actionBrowseProducts', icon: ShoppingBag },
      { actionKey: 'chat.terminal.actionPreorder', icon: Calendar },
      { actionKey: 'chat.terminal.actionTraceability', icon: QrCode },
      { actionKey: 'chat.terminal.actionContactSales', icon: Mail },
    ],
  },
  growers: {
    href: '/growers',
    actions: [
      { actionKey: 'chat.terminal.actionApplyProducer', icon: FileCheck },
      { actionKey: 'chat.terminal.actionCertification', icon: Award },
      { actionKey: 'chat.terminal.actionResources', icon: BookOpen },
      { actionKey: 'chat.terminal.actionContact', icon: Mail },
    ],
  },
  suppliers: {
    href: '/suppliers',
    actions: [
      { actionKey: 'chat.terminal.actionJoinNetwork', icon: UserPlus },
      { actionKey: 'chat.terminal.actionProducts', icon: Package },
      { actionKey: 'chat.terminal.actionRegions', icon: MapPin },
      { actionKey: 'chat.terminal.actionContact', icon: Mail },
    ],
  },
};

const AUDIENCE_NAV_KEYS: {
  key: CategoryKey;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: 'buyers', labelKey: 'nav.forBuyers', icon: ShoppingBag },
  { key: 'growers', labelKey: 'nav.forGrowers', icon: Leaf },
  { key: 'logistics', labelKey: 'nav.forLogistics', icon: Truck },
  { key: 'suppliers', labelKey: 'nav.forSuppliers', icon: Building2 },
];

function getPanelTitle(cat: CategoryKey, t: TFunction): string {
  if (cat === 'logistics') return t('chat.terminal.panelTitleLogistics');
  const row = AUDIENCE_NAV_KEYS.find((a) => a.key === cat);
  return row ? t(row.labelKey) : '';
}

function getPanelCta(cat: CategoryKey, t: TFunction): string {
  if (cat === 'buyers') return t('chat.terminal.ctaBrowseProducts');
  const row = AUDIENCE_NAV_KEYS.find((a) => a.key === cat);
  return row ? t(row.labelKey) : '';
}

const CITIES = ['Hamburg', 'Vienna', 'Munich', 'Berlin', 'Zagreb', 'Ljubljana'];

const INITIAL_TICKER = { newOrders: 6, inTransit: 8, toHamburg: 3, delivered: 78 };

// Live ticker: ref holds state (avoid setState callback returning a number instead of the next state object)
function useTicker() {
  const [ticker, setTicker] = useState(INITIAL_TICKER);
  const tickerRef = useRef(INITIAL_TICKER);
  const [newOrder, setNewOrder] = useState<{ qty: number; city: string } | null>(null);

  useEffect(() => {
    tickerRef.current = ticker;
  }, [ticker]);

  // Ticker (orders / in transit / etc.): random walk every 20–45s; avoid setState(functional updaters) in interval
  useEffect(() => {
    const intervalMs = 20000 + Math.random() * 25000;
    const id = setInterval(() => {
      const t = tickerRef.current;
      const r = Math.random();
      let next = t;
      if (r > 0.75) {
        next = { newOrders: Math.min(15, t.newOrders + 1), inTransit: Math.min(10, t.inTransit + 1), toHamburg: t.toHamburg, delivered: t.delivered };
      } else if (r > 0.5) {
        next = { newOrders: t.newOrders, inTransit: Math.max(6, t.inTransit - 1), toHamburg: Math.min(5, t.toHamburg + 1), delivered: t.delivered };
      } else if (r > 0.25) {
        next = { newOrders: t.newOrders, inTransit: t.inTransit, toHamburg: Math.max(1, t.toHamburg - 1), delivered: Math.min(88, t.delivered + 1) };
      }
      setTicker(next);
    }, intervalMs);
    return () => clearInterval(id);
  }, []);

  // New order – startuje tek nakon 2 s da pri otvaranju chata ne bi odmah re-render
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const t = setTimeout(() => {
      intervalId = setInterval(() => {
        const qty = [24, 48, 80, 120][Math.floor(Math.random() * 4)];
        const city = CITIES[Math.floor(Math.random() * CITIES.length)];
        setNewOrder({ qty, city });
        setTimeout(() => setNewOrder(null), 4000 + Math.random() * 4000);
      }, 5000 + Math.random() * 5000);
    }, 2000);
    return () => {
      clearTimeout(t);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return { ...ticker, newOrder };
}

type VeraAIChatbotProps = { inline?: boolean; inlineVariant?: 'default' | 'minimal' };

async function sendChatQuery(
  query: string,
  sessionId?: string,
  language?: string,
): Promise<{ answer: string; sessionId: string }> {
  const apiUrl = '/api/ai-assistant/query';
  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, sessionId, language }),
    });
    let data: { answer?: string; sessionId?: string; message?: string };
    try {
      data = await res.json();
    } catch {
      throw new Error(res.ok ? 'Invalid response.' : `Server error (${res.status}). Please try again.`);
    }
    if (!res.ok) {
      const msg = data?.message || (res.status >= 500 ? 'Service temporarily unavailable. Please try again.' : `Request failed (${res.status}).`);
      throw new Error(msg);
    }
    return { answer: data.answer ?? 'Sorry, I couldn’t process that. Try rephrasing or use the quick actions above.', sessionId: data.sessionId ?? '' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('fetch') || msg.includes('Failed to fetch') || msg.includes('Network')) {
      throw new Error('Cannot reach the server. Check your connection and that the backend API is running.');
    }
    throw err;
  }
}

// Default true so the first frame on mobile has no jarring animation (opacity 0→1)
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const fn = () => setIsMobile(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return isMobile;
}

export default function VeraAIChatbot({ inline, inlineVariant = 'default' }: VeraAIChatbotProps) {
  const { t, i18n } = useTranslation();
  /** BCP-47 / i18next language tag — backend maps sr→Serbian replies, en→English, etc. */
  const assistantLanguage = i18n.resolvedLanguage || i18n.language || 'en';
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const bookCall = useBookCallHref();
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'main' | CategoryKey>('main');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; link?: string; linkLabel?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ticker = useTicker();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Scroll lock without jump: keep body position fixed with current scrollY
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      const prevOverflow = document.body.style.overflow;
      const prevPosition = document.body.style.position;
      const prevTop = document.body.style.top;
      const prevWidth = document.body.style.width;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.width = '100%';
      const prevHeight = document.body.style.height;
      document.body.style.height = '100dvh';
      return () => {
        document.body.style.overflow = prevOverflow;
        document.body.style.position = prevPosition;
        document.body.style.top = prevTop;
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = prevWidth;
        document.body.style.height = prevHeight;
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const addAssistantReply = (content: string) => {
    setMessages((prev) => [...prev, { role: 'assistant', content }]);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!message.trim() || loading) return;
    const q = message.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setMessage('');
    setLoading(true);
    try {
      const { answer, sessionId } = await sendChatQuery(q, sessionIdRef.current, assistantLanguage);
      if (sessionId) sessionIdRef.current = sessionId;
      addAssistantReply(answer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      addAssistantReply(`${msg} You can also use the quick actions above or try again.`);
    }
  };

  const handleCategorySelect = (key: CategoryKey) => {
    setView(key);
  };

  const handlePanelAction = async (actionKey: string) => {
    const displayLabel = t(actionKey);
    setMessages((prev) => [...prev, { role: 'user', content: displayLabel }]);
    setLoading(true);
    try {
      const { answer, sessionId } = await sendChatQuery(displayLabel, sessionIdRef.current, assistantLanguage);
      if (sessionId) sessionIdRef.current = sessionId;
      addAssistantReply(answer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      addAssistantReply(`"${displayLabel}" — ${msg} Try again or ask your own question below.`);
    }
  };

  const isMinimalInline = inline && inlineVariant === 'minimal';

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={
          isMinimalInline
            ? 'inline-flex items-center gap-2 text-sm font-light text-gray-600 hover:text-[#2D5A27] transition-colors border-b border-transparent hover:border-[#2D5A27]/40'
            : `flex items-center gap-2 rounded-lg border border-[#2D5A27]/30 bg-white px-4 py-2.5 text-sm font-medium text-[#2D5A27] shadow-sm transition hover:bg-[#2D5A27]/5 hover:border-[#2D5A27]/50 ${inline ? '' : 'fixed bottom-5 right-5 z-[60]'}`
        }
        style={isMinimalInline ? undefined : { boxShadow: `0 2px 12px rgba(45, 90, 39, 0.12)` }}
        aria-label={isMinimalInline ? t('chat.getInTouch') : t('chat.openAssistant')}
        animate={{ opacity: 1 }}
      >
        {isMinimalInline ? (
          <>
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            <span>{t('chat.getInTouch')}</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span>{t('chat.needHelp')}</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* White overlay — on mobile, no extra animation */}
            <div
              className="fixed inset-0 z-[70] bg-white md:bg-black/20 h-[100dvh] min-h-[100dvh] min-[768px]:h-[100vh] min-[768px]:min-h-[100vh]"
              aria-hidden
            />
            {/* Mobile: bottom sheet; desktop: small window bottom-right */}
            {isMobile ? (
              <div
                className="fixed inset-0 z-[80] flex flex-col justify-end h-[100dvh] min-[768px]:h-[100vh]"
              >
                <div
                className="flex flex-col overflow-hidden border-t border-x-0 md:border bg-white shadow-2xl rounded-t-2xl md:rounded-xl w-full max-w-full min-w-0 h-[660px] md:h-[680px] touch-manipulation md:absolute md:inset-[auto_1.5rem_1.5rem_auto] md:w-[min(300px,calc(100vw-3rem))]"
                style={{
                  borderColor: 'rgba(45, 90, 39, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(45, 90, 39, 0.25)',
                }}
              >
            {/* Live ticker — fixed height so layout does not jump */}
            <div
              className="flex-shrink-0 flex flex-col gap-0.5 px-2 py-1.5 border-b font-mono text-[10px] border-gray-100 w-full min-h-[3rem]"
              style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.04))' }}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <span className="flex items-center gap-1 text-gray-600"><Package className="h-3 w-3 text-[#2D5A27]" />{ticker.newOrders} {t('chat.terminal.tickerNew')}</span>
                <span className="flex items-center gap-1 text-gray-600"><Truck className="h-3 w-3 text-[#2D5A27]" />{ticker.inTransit} {t('chat.terminal.tickerTransit')}</span>
                <span className="flex items-center gap-1 text-gray-600"><MapPin className="h-3 w-3 text-[#2D5A27]" />{ticker.toHamburg} {t('chat.terminal.tickerHub')}</span>
                <span className="flex items-center gap-1 font-medium text-[#2D5A27]"><CheckCircle className="h-3 w-3" />{ticker.delivered}% {t('chat.terminal.tickerDone')}</span>
              </div>
              <div className="min-h-[1.25rem] flex items-center overflow-hidden">
                {ticker.newOrder ? (
                  <span className="text-[#2D5A27] font-medium truncate block w-full">{t('chat.terminal.tickerFlash', { qty: ticker.newOrder.qty, city: ticker.newOrder.city })}</span>
                ) : (
                  <span className="text-transparent select-none block w-full" aria-hidden>...</span>
                )}
              </div>
            </div>

            {/* Header */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-gray-100"
              style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.03))' }}
            >
              <div className="min-w-0">
                <div className="text-xs md:text-sm font-semibold tracking-wide truncate" style={{ color: VERA_GREEN }}>
                  {t('chat.terminal.title')}
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">{t('chat.terminal.subtitle')}</div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="https://wa.me/381601234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1.5 text-gray-600 hover:bg-white/60 hover:text-[#2D5A27] transition"
                  aria-label={t('chat.ariaWhatsapp')}
                >
                  <Zap className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1.5 text-gray-500 hover:bg-white/60 hover:text-gray-800 transition"
                  aria-label={t('chat.ariaClose')}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex-shrink-0 border-b border-gray-100 p-2 md:p-3 min-h-[80px] md:min-h-[110px]">
              <AnimatePresence mode="wait">
                {view === 'main' ? (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-2 gap-1.5 md:gap-2"
                  >
                    {AUDIENCE_NAV_KEYS.map(({ key, labelKey, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorySelect(key)}
                        className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                      >
                        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" />
                        <span className="truncate">{t(labelKey)}</span>
                      </button>
                    ))}
                    {bookCall.enabled && (
                      <Link
                        href={bookCall.href}
                        onClick={() => setOpen(false)}
                        className="col-span-2 flex items-center justify-center gap-2 rounded-md md:rounded-lg py-2 md:py-2.5 text-[11px] md:text-xs font-semibold text-white transition hover:opacity-90"
                        style={{ backgroundColor: VERA_GREEN }}
                      >
                        <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />
                        {t('bookCall.navCta')}
                      </Link>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-2 md:space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => setView('main')}
                      className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-gray-600 hover:text-[#2D5A27] transition"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      {t('chat.terminal.back')}
                    </button>
                    <p className="text-[11px] md:text-xs font-medium text-gray-500">
                      {getPanelTitle(view, t)}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {CATEGORY_PANEL_DEFS[view].actions.map(({ actionKey, icon: Icon }) => (
                        <button
                          key={actionKey}
                          type="button"
                          onClick={() => handlePanelAction(actionKey)}
                          className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2.5 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                        >
                          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" />
                          <span className="leading-tight line-clamp-2">{t(actionKey)}</span>
                        </button>
                      ))}
                    </div>
                    <Link
                      href={CATEGORY_PANEL_DEFS[view].href}
                      className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: VERA_GREEN }}
                    >
                      {getPanelCta(view, t)}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main chat area — room for long text, break-words to avoid layout overflow */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 md:p-3 space-y-2 md:space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs md:text-sm text-gray-500 py-3 md:py-4 font-light px-2">
                  {t('chat.terminal.hintEmpty')}
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm break-words ${
                    m.role === 'user'
                      ? 'ml-4 md:ml-6 bg-[#2D5A27] text-white'
                      : 'mr-4 md:mr-6 border border-gray-200 bg-white text-gray-700'
                  } ${m.role === 'assistant' && !m.link ? 'font-mono whitespace-pre-wrap' : ''}`}
                >
                  {m.content}
                  {m.role === 'assistant' && m.link && m.linkLabel && (
                    <Link
                      href={m.link}
                      className="mt-2 inline-block text-xs font-medium hover:underline"
                      style={{ color: VERA_GREEN }}
                    >
                      {m.linkLabel} →
                    </Link>
                  )}
                </div>
              ))}
              {loading && (
                <div className="mr-6 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 font-mono">
                  {t('chat.terminal.thinking')}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input — 16px font on mobile to avoid iOS input zoom, safe-area padding at bottom */}
            <div className="flex-shrink-0 flex gap-1.5 md:gap-2 border-t border-gray-100 p-2 md:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white">
              <div className="relative flex-1 min-w-0">
                <Search
                  className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 pointer-events-none"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                  placeholder={t('chat.terminal.placeholder')}
                  disabled={loading}
                  className="w-full rounded-lg border border-gray-200 py-2 pl-8 md:pl-9 pr-2 md:pr-3 text-base outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 disabled:opacity-60 min-w-0"
                  style={{ fontSize: '16px' }}
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={loading}
                className="rounded-lg px-3 py-2 text-white transition hover:opacity-90 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: VERA_GREEN }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            </div>
          </div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="fixed inset-0 z-[80] flex flex-col overflow-hidden h-[100dvh] min-h-[100dvh] min-[768px]:h-[100vh] min-[768px]:min-h-[100vh]"
              >
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden border-0 md:border bg-white shadow-2xl rounded-none w-full max-w-full min-w-0 min-h-0 touch-manipulation md:inset-[auto_1.5rem_1.5rem_auto] md:min-h-0 md:h-[680px] md:w-[min(340px,calc(100vw-3rem))] md:rounded-xl"
                  style={{
                    borderColor: 'rgba(45, 90, 39, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(45, 90, 39, 0.25)',
                  }}
                >
                  {/* Ticker — fixed height */}
                  <div
                    className="flex-shrink-0 flex flex-col gap-0.5 px-2 py-1.5 border-b font-mono text-[10px] border-gray-100 w-full min-h-[3rem]"
                    style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.04))' }}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span className="flex items-center gap-1 text-gray-600"><Package className="h-3 w-3 text-[#2D5A27]" />{ticker.newOrders} {t('chat.terminal.tickerNew')}</span>
                      <span className="flex items-center gap-1 text-gray-600"><Truck className="h-3 w-3 text-[#2D5A27]" />{ticker.inTransit} {t('chat.terminal.tickerTransit')}</span>
                      <span className="flex items-center gap-1 text-gray-600"><MapPin className="h-3 w-3 text-[#2D5A27]" />{ticker.toHamburg} {t('chat.terminal.tickerHub')}</span>
                      <span className="flex items-center gap-1 font-medium text-[#2D5A27]"><CheckCircle className="h-3 w-3" />{ticker.delivered}% {t('chat.terminal.tickerDone')}</span>
                    </div>
                    <div className="min-h-[1.25rem] flex items-center overflow-hidden">
                      {ticker.newOrder ? (
                        <span className="text-[#2D5A27] font-medium truncate block w-full">{t('chat.terminal.tickerFlash', { qty: ticker.newOrder.qty, city: ticker.newOrder.city })}</span>
                      ) : (
                        <span className="text-transparent select-none block w-full" aria-hidden>...</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 md:px-4 md:py-2.5 border-b border-gray-100" style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.03))' }}>
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold tracking-wide truncate" style={{ color: VERA_GREEN }}>{t('chat.terminal.title')}</div>
                      <div className="text-[10px] md:text-xs text-gray-500">{t('chat.terminal.subtitle')}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href="https://wa.me/381601234567" target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-gray-600 hover:bg-white/60 hover:text-[#2D5A27] transition" aria-label={t('chat.ariaWhatsapp')}><Zap className="h-5 w-5" /></Link>
                      <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-gray-500 hover:bg-white/60 hover:text-gray-800 transition" aria-label={t('chat.ariaClose')}><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 border-b border-gray-100 p-2 md:p-3 min-h-[80px] md:min-h-[110px]">
                    <AnimatePresence mode="wait">
                      {view === 'main' ? (
                        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 gap-1.5 md:gap-2">
                          {AUDIENCE_NAV_KEYS.map(({ key, labelKey, icon: Icon }) => (
                            <button key={key} type="button" onClick={() => handleCategorySelect(key)} className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50">
                              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" /><span className="truncate">{t(labelKey)}</span>
                            </button>
                          ))}
                          {bookCall.enabled && (
                            <Link href={bookCall.href} onClick={() => setOpen(false)} className="col-span-2 flex items-center justify-center gap-2 rounded-md md:rounded-lg py-2 md:py-2.5 text-[11px] md:text-xs font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: VERA_GREEN }}>
                              <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" aria-hidden />{t('bookCall.navCta')}
                            </Link>
                          )}
                        </motion.div>
                      ) : (
                        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2 md:space-y-3">
                          <button type="button" onClick={() => setView('main')} className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-gray-600 hover:text-[#2D5A27] transition"><ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />{t('chat.terminal.back')}</button>
                          <p className="text-[11px] md:text-xs font-medium text-gray-500">{getPanelTitle(view, t)}</p>
                          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                            {CATEGORY_PANEL_DEFS[view].actions.map(({ actionKey, icon: Icon }) => (
                              <button key={actionKey} type="button" onClick={() => handlePanelAction(actionKey)} className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2.5 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50">
                                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" /><span className="leading-tight line-clamp-2">{t(actionKey)}</span>
                              </button>
                            ))}
                          </div>
                          <Link href={CATEGORY_PANEL_DEFS[view].href} className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: VERA_GREEN }}>{getPanelCta(view, t)}</Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 md:p-3 space-y-2 md:space-y-3">
                    {messages.length === 0 && <p className="text-center text-xs md:text-sm text-gray-500 py-3 md:py-4 font-light px-2">{t('chat.terminal.hintEmpty')}</p>}
                    {messages.map((m, i) => (
                      <div key={i} className={`rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm break-words ${m.role === 'user' ? 'ml-4 md:ml-6 bg-[#2D5A27] text-white' : 'mr-4 md:mr-6 border border-gray-200 bg-white text-gray-700'} ${m.role === 'assistant' && !m.link ? 'font-mono whitespace-pre-wrap' : ''}`}>
                        {m.content}
                        {m.role === 'assistant' && m.link && m.linkLabel && <Link href={m.link} className="mt-2 inline-block text-xs font-medium hover:underline" style={{ color: VERA_GREEN }}>{m.linkLabel} →</Link>}
                      </div>
                    ))}
                    {loading && <div className="mr-6 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 font-mono">{t('chat.terminal.thinking')}</div>}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex-shrink-0 flex gap-1.5 md:gap-2 border-t border-gray-100 p-2 md:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 pointer-events-none" strokeWidth={2} />
                      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()} placeholder={t('chat.terminal.placeholder')} disabled={loading} className="w-full rounded-lg border border-gray-200 py-2 pl-8 md:pl-9 pr-2 md:pr-3 text-base outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 disabled:opacity-60 min-w-0" style={{ fontSize: '16px' }} autoComplete="off" />
                    </div>
                    <button type="button" onClick={() => handleSend()} disabled={loading} className="rounded-lg px-3 py-2 text-white transition hover:opacity-90 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: VERA_GREEN }}><Send className="h-4 w-4" /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
}
