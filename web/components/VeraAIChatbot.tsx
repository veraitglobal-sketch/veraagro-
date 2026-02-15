'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Zap, Package, Route, Calculator, Search, ShoppingBag, Leaf, Truck, Building2, Calendar, QrCode, Mail, FileCheck, Award, BookOpen, UserPlus, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const VERA_GREEN = '#2D5A27';

type CategoryKey = 'buyers' | 'growers' | 'logistics' | 'suppliers';

// Kada korisnik klikne na kategoriju, prikaže se panel sa naslovom, 2x2 akcijama i velikim CTA dugmetom
const categoryPanels: Record<CategoryKey, {
  title: string;
  ctaLabel: string;
  href: string;
  actions: { label: string; icon: React.ComponentType<{ className?: string }> }[];
}> = {
  logistics: {
    title: 'Logistics analytics',
    ctaLabel: 'For Logistics',
    href: '/logistics-partner',
    actions: [
      { label: 'Load Optimization', icon: Package },
      { label: 'Route Efficiency', icon: Route },
      { label: 'Packaging Integrity', icon: Package },
      { label: 'Cost Analysis', icon: Calculator },
    ],
  },
  buyers: {
    title: 'For Buyers',
    ctaLabel: 'Browse Products',
    href: '/for-buyers',
    actions: [
      { label: 'Browse Products', icon: ShoppingBag },
      { label: 'Pre-order', icon: Calendar },
      { label: 'Traceability', icon: QrCode },
      { label: 'Contact Sales', icon: Mail },
    ],
  },
  growers: {
    title: 'For Growers',
    ctaLabel: 'For Growers',
    href: '/growers',
    actions: [
      { label: 'Apply as Producer', icon: FileCheck },
      { label: 'Certification', icon: Award },
      { label: 'Resources', icon: BookOpen },
      { label: 'Contact', icon: Mail },
    ],
  },
  suppliers: {
    title: 'For Suppliers',
    ctaLabel: 'For Suppliers',
    href: '/suppliers',
    actions: [
      { label: 'Join Network', icon: UserPlus },
      { label: 'Products', icon: Package },
      { label: 'Regions', icon: MapPin },
      { label: 'Contact', icon: Mail },
    ],
  },
};

const CITIES = ['Hamburg', 'Vienna', 'Munich', 'Berlin', 'Zagreb', 'Ljubljana'];

const INITIAL_TICKER = { newOrders: 6, inTransit: 8, toHamburg: 3, delivered: 78 };

// Live ticker: ref drži stanje da ne koristimo setState(prev =>) – izbegava grešku sa brojem umesto objekta
function useTicker() {
  const [ticker, setTicker] = useState(INITIAL_TICKER);
  const tickerRef = useRef(INITIAL_TICKER);
  const [newOrder, setNewOrder] = useState<{ qty: number; city: string } | null>(null);

  useEffect(() => {
    tickerRef.current = ticker;
  }, [ticker]);

  // Kamioni / brojke – menja se na 20–45 s, povezana logika (bez setState(prev =>))
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

const audienceButtons: { key: CategoryKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'buyers', label: 'For Buyers', icon: ShoppingBag },
  { key: 'growers', label: 'For Growers', icon: Leaf },
  { key: 'logistics', label: 'For Logistics', icon: Truck },
  { key: 'suppliers', label: 'For Suppliers', icon: Building2 },
];

type VeraAIChatbotProps = { inline?: boolean; inlineVariant?: 'default' | 'minimal' };

function getApiBase(): string {
  if (typeof window === 'undefined') return process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app';
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.biovera.app';
}

async function sendChatQuery(query: string, sessionId?: string): Promise<{ answer: string; sessionId: string }> {
  const base = getApiBase();
  const res = await fetch(`${base}/ai-assistant/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sessionId }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  const data = await res.json();
  return { answer: data.answer ?? 'Sorry, I couldn’t process that. Try rephrasing or use the quick actions above.', sessionId: data.sessionId ?? '' };
}

// Podrazumevano true da na mobilnom prvom frame-u ne bude animacija (opacity 0→1)
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
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
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

  // Scroll lock bez pomeranja: body postaje fixed sa trenutnim scrollY da ništa ne skoči
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
      const { answer, sessionId } = await sendChatQuery(q, sessionIdRef.current);
      if (sessionId) sessionIdRef.current = sessionId;
      addAssistantReply(answer);
    } catch {
      addAssistantReply('Connection error. Check your internet or try again. You can also use the quick actions above.');
    }
  };

  const handleCategorySelect = (key: CategoryKey) => {
    setView(key);
  };

  const handlePanelAction = async (label: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: label }]);
    setLoading(true);
    try {
      const { answer, sessionId } = await sendChatQuery(label, sessionIdRef.current);
      if (sessionId) sessionIdRef.current = sessionId;
      addAssistantReply(answer);
    } catch {
      addAssistantReply(`"${label}" — connection error. Try again or ask your own question below.`);
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
        aria-label={isMinimalInline ? 'Get in touch' : 'Open Vera AI Assistant'}
        animate={{ opacity: 1 }}
      >
        {isMinimalInline ? (
          <>
            <Mail className="h-4 w-4" strokeWidth={1.5} />
            <span>Get in touch</span>
          </>
        ) : (
          <>
            <MessageCircle className="h-5 w-5" />
            <span>Need help?</span>
          </>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Bela pozadina – na mobilnom bez ikakve animacije */}
            <div
              className="fixed inset-0 z-[70] bg-white md:bg-black/20 h-[100dvh] min-h-[100dvh] min-[768px]:h-[100vh] min-[768px]:min-h-[100vh]"
              aria-hidden
            />
            {/* Na mobilnom običan div (bez motion) da nema treptanja; na desktopu fade */}
            {isMobile ? (
              <div
                className="fixed inset-0 z-[80] flex flex-col overflow-hidden h-[100dvh] min-h-[100dvh] min-[768px]:h-[100vh] min-[768px]:min-h-[100vh]"
              >
                <div
                className="absolute inset-0 flex flex-col overflow-hidden border-0 md:border bg-white shadow-2xl rounded-none w-full max-w-full min-w-0 min-h-full touch-manipulation md:inset-[auto_1.5rem_1.5rem_auto] md:h-[650px] md:max-h-[650px] md:w-[min(350px,calc(100vw-3rem))] md:rounded-xl"
                style={{
                  borderColor: 'rgba(45, 90, 39, 0.2)',
                  boxShadow: '0 25px 50px -12px rgba(45, 90, 39, 0.25)',
                }}
              >
            {/* Live Ticker – uvek ista visina: red za "New order" uvek zauzet */}
            <div
              className="flex-shrink-0 flex flex-col border-b font-mono border-gray-100 w-full"
              style={{
                background: 'linear-gradient(to bottom, rgba(45,90,39,0.1), rgba(45,90,39,0.05))',
                height: '5rem',
                minHeight: '5rem',
                maxHeight: '5rem',
              }}
            >
              {/* Red 1: brojevi New / Transit / → HH / Done (3rem) */}
              <div
                className="flex items-center justify-between gap-0.5 md:gap-1 flex-shrink-0 px-2 md:px-3 w-full box-border"
                style={{ height: '3rem', minHeight: '3rem', maxHeight: '3rem' }}
              >
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs">
                    <Package className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />
                    {ticker.newOrders}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">New</span>
                </div>
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs">
                    <Truck className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />
                    {ticker.inTransit}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">Transit</span>
                </div>
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs">
                    <MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />
                    {ticker.toHamburg}
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">→ HH</span>
                </div>
                <div className="flex flex-col items-center min-w-0 flex-1">
                  <span className="font-medium text-[#2D5A27] text-[10px] md:text-xs flex items-center justify-center gap-0.5">
                    <CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />
                    {ticker.delivered}%
                  </span>
                  <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">Done</span>
                </div>
              </div>
              {/* Red 2: "New order" – uvek 2rem visine, tekst se samo menja unutra */}
              <div
                className="flex-shrink-0 flex items-center px-2 md:px-3 w-full overflow-hidden box-border"
                style={{ height: '2rem', minHeight: '2rem', maxHeight: '2rem' }}
              >
                {ticker.newOrder ? (
                  <span className="text-[#2D5A27] font-medium text-[10px] md:text-xs truncate block w-full">
                    New order: {ticker.newOrder.qty} boxes → {ticker.newOrder.city}
                  </span>
                ) : (
                  <span className="block w-full text-transparent select-none" aria-hidden>New order: …</span>
                )}
              </div>
            </div>

            {/* Header – flex-shrink-0, kompaktnije na mobilnom */}
            <div
              className="flex-shrink-0 flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-gray-100"
              style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.03))' }}
            >
              <div className="min-w-0">
                <div className="text-xs md:text-sm font-semibold tracking-wide truncate" style={{ color: VERA_GREEN }}>
                  INTELLIGENCE TERMINAL
                </div>
                <div className="text-[10px] md:text-xs text-gray-500">Logistics Analytics v2.1</div>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href="https://wa.me/381601234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1.5 text-gray-600 hover:bg-white/60 hover:text-[#2D5A27] transition"
                  aria-label="WhatsApp"
                >
                  <Zap className="h-5 w-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded p-1.5 text-gray-500 hover:bg-white/60 hover:text-gray-800 transition"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Kategorije – manje kolone i padding na mobilnom da ima mesta za tekst */}
            <div className="flex-shrink-0 border-b border-gray-100 p-2 md:p-3 min-h-[90px] md:min-h-[140px]">
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
                    {audienceButtons.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorySelect(key)}
                        className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                      >
                        <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" />
                        <span className="truncate">{label}</span>
                      </button>
                    ))}
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
                      Back
                    </button>
                    <p className="text-[11px] md:text-xs font-medium text-gray-500">
                      {categoryPanels[view].title}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                      {categoryPanels[view].actions.map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handlePanelAction(label)}
                          className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2.5 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                        >
                          <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" />
                          <span className="leading-tight line-clamp-2">{label}</span>
                        </button>
                      ))}
                    </div>
                    <Link
                      href={categoryPanels[view].href}
                      className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: VERA_GREEN }}
                    >
                      {categoryPanels[view].ctaLabel}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sredina: chat — više mesta za tekst, break-words da se ne prelama layout */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 md:p-3 space-y-2 md:space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs md:text-sm text-gray-500 py-3 md:py-4 font-light px-2">
                  Click a category above to see options, or ask any question here.
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
                  Thinking…
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input – 16px font na mobilnom da iOS ne zumira pri fokusu, safe-area dole */}
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
                  placeholder="Ask anything else..."
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
                  className="absolute inset-0 flex flex-col overflow-hidden border-0 md:border bg-white shadow-2xl rounded-none w-full max-w-full min-w-0 min-h-full touch-manipulation md:inset-[auto_1.5rem_1.5rem_auto] md:h-[650px] md:max-h-[650px] md:w-[min(350px,calc(100vw-3rem))] md:rounded-xl"
                  style={{
                    borderColor: 'rgba(45, 90, 39, 0.2)',
                    boxShadow: '0 25px 50px -12px rgba(45, 90, 39, 0.25)',
                  }}
                >
                  {/* Ticker – fiksna visina, prostor za New order */}
                  <div
                    className="flex-shrink-0 flex flex-col border-b font-mono border-gray-100 w-full"
                    style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.1), rgba(45,90,39,0.05))', height: '5rem', minHeight: '5rem', maxHeight: '5rem' }}
                  >
                    <div className="flex items-center justify-between gap-0.5 md:gap-1 flex-shrink-0 px-2 md:px-3 w-full box-border" style={{ height: '3rem', minHeight: '3rem', maxHeight: '3rem' }}>
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs"><Package className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />{ticker.newOrders}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">New</span>
                      </div>
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs"><Truck className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />{ticker.inTransit}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">Transit</span>
                      </div>
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="flex items-center justify-center gap-0.5 text-gray-700 text-[10px] md:text-xs"><MapPin className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0 text-[#2D5A27]" />{ticker.toHamburg}</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">→ HH</span>
                      </div>
                      <div className="flex flex-col items-center min-w-0 flex-1">
                        <span className="font-medium text-[#2D5A27] text-[10px] md:text-xs flex items-center justify-center gap-0.5"><CheckCircle className="h-3 w-3 md:h-3.5 md:w-3.5 flex-shrink-0" />{ticker.delivered}%</span>
                        <span className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-wide">Done</span>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center px-2 md:px-3 w-full overflow-hidden box-border" style={{ height: '2rem', minHeight: '2rem', maxHeight: '2rem' }}>
                      {ticker.newOrder ? (
                        <span className="text-[#2D5A27] font-medium text-[10px] md:text-xs truncate block w-full">New order: {ticker.newOrder.qty} boxes → {ticker.newOrder.city}</span>
                      ) : (
                        <span className="block w-full text-transparent select-none" aria-hidden>New order: …</span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 md:px-4 md:py-3 border-b border-gray-100" style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.03))' }}>
                    <div className="min-w-0">
                      <div className="text-xs md:text-sm font-semibold tracking-wide truncate" style={{ color: VERA_GREEN }}>INTELLIGENCE TERMINAL</div>
                      <div className="text-[10px] md:text-xs text-gray-500">Logistics Analytics v2.1</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href="https://wa.me/381601234567" target="_blank" rel="noopener noreferrer" className="rounded p-1.5 text-gray-600 hover:bg-white/60 hover:text-[#2D5A27] transition" aria-label="WhatsApp"><Zap className="h-5 w-5" /></Link>
                      <button type="button" onClick={() => setOpen(false)} className="rounded p-1.5 text-gray-500 hover:bg-white/60 hover:text-gray-800 transition" aria-label="Close"><X className="h-5 w-5" /></button>
                    </div>
                  </div>
                  <div className="flex-shrink-0 border-b border-gray-100 p-2 md:p-3 min-h-[90px] md:min-h-[140px]">
                    <AnimatePresence mode="wait">
                      {view === 'main' ? (
                        <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 gap-1.5 md:gap-2">
                          {audienceButtons.map(({ key, label, icon: Icon }) => (
                            <button key={key} type="button" onClick={() => handleCategorySelect(key)} className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50">
                              <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" /><span className="truncate">{label}</span>
                            </button>
                          ))}
                        </motion.div>
                      ) : (
                        <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-2 md:space-y-3">
                          <button type="button" onClick={() => setView('main')} className="flex items-center gap-1 text-[11px] md:text-xs font-medium text-gray-600 hover:text-[#2D5A27] transition"><ArrowLeft className="h-3.5 w-3.5 md:h-4 md:w-4" />Back</button>
                          <p className="text-[11px] md:text-xs font-medium text-gray-500">{categoryPanels[view].title}</p>
                          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                            {categoryPanels[view].actions.map(({ label, icon: Icon }) => (
                              <button key={label} type="button" onClick={() => handlePanelAction(label)} className="flex items-center gap-1.5 md:gap-2 rounded-md md:rounded-lg border border-gray-200 bg-white px-2 py-1.5 md:px-3 md:py-2.5 text-left text-[11px] md:text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50">
                                <Icon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 text-[#2D5A27]" /><span className="leading-tight line-clamp-2">{label}</span>
                              </button>
                            ))}
                          </div>
                          <Link href={categoryPanels[view].href} className="flex items-center justify-center gap-2 w-full rounded-lg py-2.5 md:py-3 text-xs md:text-sm font-semibold text-white transition hover:opacity-90" style={{ backgroundColor: VERA_GREEN }}>{categoryPanels[view].ctaLabel}</Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 md:p-3 space-y-2 md:space-y-3">
                    {messages.length === 0 && <p className="text-center text-xs md:text-sm text-gray-500 py-3 md:py-4 font-light px-2">Click a category above to see options, or ask any question here.</p>}
                    {messages.map((m, i) => (
                      <div key={i} className={`rounded-lg px-2.5 py-1.5 md:px-3 md:py-2 text-xs md:text-sm break-words ${m.role === 'user' ? 'ml-4 md:ml-6 bg-[#2D5A27] text-white' : 'mr-4 md:mr-6 border border-gray-200 bg-white text-gray-700'} ${m.role === 'assistant' && !m.link ? 'font-mono whitespace-pre-wrap' : ''}`}>
                        {m.content}
                        {m.role === 'assistant' && m.link && m.linkLabel && <Link href={m.link} className="mt-2 inline-block text-xs font-medium hover:underline" style={{ color: VERA_GREEN }}>{m.linkLabel} →</Link>}
                      </div>
                    ))}
                    {loading && <div className="mr-6 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 font-mono">Thinking…</div>}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex-shrink-0 flex gap-1.5 md:gap-2 border-t border-gray-100 p-2 md:p-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-white">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-2.5 md:left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 pointer-events-none" strokeWidth={2} />
                      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()} placeholder="Ask anything else..." disabled={loading} className="w-full rounded-lg border border-gray-200 py-2 pl-8 md:pl-9 pr-2 md:pr-3 text-base outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20 disabled:opacity-60 min-w-0" style={{ fontSize: '16px' }} autoComplete="off" />
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
