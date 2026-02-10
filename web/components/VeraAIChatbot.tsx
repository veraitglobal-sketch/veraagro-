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
    href: '/products',
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

  // New order – potpuno nezavisno od kamiona, češće (svakih 5–10 s), ostane 4–8 s
  useEffect(() => {
    const intervalId = setInterval(() => {
      const qty = [24, 48, 80, 120][Math.floor(Math.random() * 4)];
      const city = CITIES[Math.floor(Math.random() * CITIES.length)];
      setNewOrder({ qty, city });
      setTimeout(() => setNewOrder(null), 4000 + Math.random() * 4000);
    }, 5000 + Math.random() * 5000);
    return () => clearInterval(intervalId);
  }, []);

  return { ...ticker, newOrder };
}

const audienceButtons: { key: CategoryKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'buyers', label: 'For Buyers', icon: ShoppingBag },
  { key: 'growers', label: 'For Growers', icon: Leaf },
  { key: 'logistics', label: 'For Logistics', icon: Truck },
  { key: 'suppliers', label: 'For Suppliers', icon: Building2 },
];

type VeraAIChatbotProps = { inline?: boolean };

export default function VeraAIChatbot({ inline }: VeraAIChatbotProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'main' | CategoryKey>('main');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string; link?: string; linkLabel?: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ticker = useTicker();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!message.trim()) return;
    const q = message.trim();
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setMessage('');
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: 'Connect to the backend for full answers. You can also use the quick actions above or ask anything else here.',
      },
    ]);
  };

  const handleCategorySelect = (key: CategoryKey) => {
    setView(key);
  };

  const handlePanelAction = (label: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: label }]);
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `"${label}" — connect backend for details, or ask your own question below.`,
      },
    ]);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 rounded-lg border border-[#2D5A27]/30 bg-white px-4 py-2.5 text-sm font-medium text-[#2D5A27] shadow-sm transition hover:bg-[#2D5A27]/5 hover:border-[#2D5A27]/50 ${inline ? '' : 'fixed bottom-5 right-5 z-40'}`}
        style={{
          boxShadow: `0 2px 12px rgba(45, 90, 39, 0.12)`,
        }}
        aria-label="Open Vera AI Assistant"
        animate={{ opacity: 1 }}
      >
        <MessageCircle className="h-5 w-5" />
        <span>Need help?</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex flex-col overflow-hidden rounded-xl border bg-white/95 shadow-2xl backdrop-blur-md"
            style={{
              width: 'min(350px, calc(100vw - 3rem))',
              maxHeight: '650px',
              height: '650px',
              borderColor: 'rgba(45, 90, 39, 0.2)',
              boxShadow: `0 25px 50px -12px rgba(45, 90, 39, 0.25)`,
            }}
          >
            {/* Live Ticker – šta znače brojevi: New orders | In transit | To Hamburg | Delivered % */}
            <div
              className="px-3 py-2 border-b font-mono text-xs space-y-1"
              style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.1), rgba(45,90,39,0.05))' }}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-gray-700">
                    <Package className="h-3.5 w-3 text-[#2D5A27]" />
                    {ticker.newOrders}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">New</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-gray-700">
                    <Truck className="h-3.5 w-3 text-[#2D5A27]" />
                    {ticker.inTransit}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Transit</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="flex items-center gap-1 text-gray-700">
                    <MapPin className="h-3.5 w-3 text-[#2D5A27]" />
                    {ticker.toHamburg}
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">→ Hamburg</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-medium text-[#2D5A27]">
                    <CheckCircle className="h-3.5 w-3 inline mr-0.5" />
                    {ticker.delivered}%
                  </span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Done</span>
                </div>
              </div>
              {ticker.newOrder && (
                <div className="text-[#2D5A27] font-medium pt-0.5">
                  New order: {ticker.newOrder.qty} boxes → {ticker.newOrder.city}
                </div>
              )}
            </div>

            {/* Header: INTELLIGENCE TERMINAL + WhatsApp + Close */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ background: 'linear-gradient(to bottom, rgba(45,90,39,0.08), rgba(45,90,39,0.03))' }}
            >
              <div>
                <div className="text-sm font-semibold tracking-wide" style={{ color: VERA_GREEN }}>
                  INTELLIGENCE TERMINAL
                </div>
                <div className="text-xs text-gray-500">Logistics Analytics v2.1</div>
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

            {/* Jedan prikaz: ili 4 kategorije (main) ili panel kategorije + Nazad */}
            <div className="border-b border-gray-100 p-3 min-h-[140px]">
              <AnimatePresence mode="wait">
                {view === 'main' ? (
                  <motion.div
                    key="main"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="grid grid-cols-2 gap-2"
                  >
                    {audienceButtons.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleCategorySelect(key)}
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                      >
                        <Icon className="h-4 w-4 flex-shrink-0 text-[#2D5A27]" />
                        {label}
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
                    className="space-y-3"
                  >
                    <button
                      type="button"
                      onClick={() => setView('main')}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-[#2D5A27] transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </button>
                    <p className="text-xs font-medium text-gray-500">
                      {categoryPanels[view].title}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryPanels[view].actions.map(({ label, icon: Icon }) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => handlePanelAction(label)}
                          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left text-xs font-medium text-gray-700 transition hover:border-[#2D5A27]/40 hover:bg-gray-50"
                        >
                          <Icon className="h-4 w-4 flex-shrink-0 text-[#2D5A27]" />
                          <span className="leading-tight">{label}</span>
                        </button>
                      ))}
                    </div>
                    <Link
                      href={categoryPanels[view].href}
                      className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90"
                      style={{ backgroundColor: VERA_GREEN }}
                    >
                      {categoryPanels[view].ctaLabel}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sredina: chat za slobodna pitanja */}
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
              {messages.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4 font-light px-2">
                  Click a category above to see options, or ask any question here.
                </p>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'ml-6 bg-[#2D5A27] text-white'
                      : 'mr-6 border border-gray-200 bg-white text-gray-700'
                  } ${m.role === 'assistant' && !m.link ? 'font-mono' : ''}`}
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
              <div ref={messagesEndRef} />
            </div>

            {/* Input – Search ikona levo, placeholder, Send zelena */}
            <div className="flex gap-2 border-t border-gray-100 p-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask anything else..."
                  className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#2D5A27] focus:ring-1 focus:ring-[#2D5A27]/20"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                className="rounded-lg px-3 py-2 text-white transition hover:opacity-90 flex-shrink-0"
                style={{ backgroundColor: VERA_GREEN }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
