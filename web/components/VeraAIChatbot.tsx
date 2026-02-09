'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Search, Package, Activity, Zap, ShoppingCart, MessageCircle, Users, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestedActions?: Array<{ label: string; url: string }>;
  quickActions?: Array<{ label: string; query: string }>;
  askForContact?: boolean;
}

interface PreOrder {
  id: string;
  city: string;
  product: string;
  quantity: number;
  unit: string;
  timestamp: Date;
}

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+4915563740470';

// Simulated cities and products for pre-orders
const cities = ['Hamburg', 'Berlin', 'Munich', 'Vienna', 'Frankfurt', 'Stuttgart', 'Zagreb', 'Ljubljana'];
const products = ['Organic Strawberries', 'Bio Tomatoes', 'Fresh Lettuce', 'Organic Carrots', 'Bio Peppers', 'Fresh Cucumbers'];

export default function VeraAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    consentGiven: false,
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [preOrders, setPreOrders] = useState<PreOrder[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize session ID from localStorage or generate new
    if (typeof window !== 'undefined') {
      let currentSessionId = localStorage.getItem('ai_session_id');
      if (!currentSessionId) {
        currentSessionId = uuidv4();
        localStorage.setItem('ai_session_id', currentSessionId);
      }
      setSessionId(currentSessionId);
    }
  }, []);

  // Live Pre-Order ticker simulation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Generate random pre-order
      const newOrder: PreOrder = {
        id: uuidv4(),
        city: cities[Math.floor(Math.random() * cities.length)],
        product: products[Math.floor(Math.random() * products.length)],
        quantity: Math.floor(Math.random() * 500) + 100,
        unit: 'kg',
        timestamp: new Date(),
      };

      setPreOrders(prev => {
        const updated = [newOrder, ...prev].slice(0, 5); // Keep last 5 orders
        return updated;
      });
    }, 10000); // New order every 10 seconds

    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll ticker
  useEffect(() => {
    if (tickerRef.current && preOrders.length > 0) {
      tickerRef.current.scrollLeft = 0;
    }
  }, [preOrders]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showContactForm]);

  useEffect(() => {
    if (isOpen && inputRef.current && messages.length === 0 && !showContactForm) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages.length, showContactForm]);

  const handleSend = async (query?: string) => {
    const userMessage = query || input.trim();
    if (!userMessage.trim()) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/ai-assistant/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, sessionId }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      if (data.sessionId) {
        setSessionId(data.sessionId);
        localStorage.setItem('ai_session_id', data.sessionId);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer,
        suggestedActions: data.suggestedActions,
        quickActions: data.quickActions,
        askForContact: data.askForContact,
      }]);

      if (data.askForContact) {
        setShowContactForm(true);
      }
    } catch (error) {
      console.error('AI query error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'System error. Please retry or contact support via WhatsApp.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello, I have a question about BioVera logistics optimization.');
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.consentGiven || !contactForm.name || !contactForm.email) {
      return;
    }

    setContactSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004'}/ai-assistant/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId,
          name: contactForm.name,
          email: contactForm.email,
          phone: contactForm.phone || undefined,
          message: contactForm.message || undefined,
          consentGiven: contactForm.consentGiven,
        }),
      });

      if (!response.ok) throw new Error('Failed to submit contact request');

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Contact request logged. Our logistics team will analyze your requirements and respond within 24h.',
        askForContact: false,
      }]);

      setShowContactForm(false);
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        consentGiven: false,
      });
    } catch (error) {
      console.error('Contact submit error:', error);
      alert('Failed to submit contact request. Please try again.');
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-8 right-8 px-6 py-3 bg-white border-2 border-green-600 text-green-600 text-sm font-medium hover:bg-green-50 transition-colors rounded-lg shadow-lg z-50 flex items-center gap-2"
            aria-label="Open Assistant"
          >
            <MessageCircle className="w-5 h-5 text-green-600" strokeWidth={1.5} />
            <span className="text-green-600">Need help?</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Intelligence Terminal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            
            {/* Terminal Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed bottom-8 right-8 w-[350px] h-[650px] bg-white/95 backdrop-blur-md shadow-2xl z-50 flex flex-col rounded-xl border border-green-200 overflow-hidden"
              style={{
                boxShadow: '0 20px 60px rgba(34, 197, 94, 0.1), 0 0 0 1px rgba(34, 197, 94, 0.05)',
              }}
            >
              {/* Live Pre-Order Ticker */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-green-50/50 to-green-50/30 border-b border-green-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-green-600 uppercase">Live Pre-Orders</span>
                  </div>
                </div>
                <div 
                  ref={tickerRef}
                  className="flex gap-4 overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {preOrders.length === 0 ? (
                    <div className="text-[9px] font-mono text-gray-500">Waiting for new orders...</div>
                  ) : (
                    preOrders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 flex-shrink-0 px-2 py-1 bg-white/60 rounded border border-green-200"
                      >
                        <ShoppingCart className="w-3 h-3 text-green-600" strokeWidth={1.5} />
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono text-green-600 font-medium">{order.city}</span>
                          <span className="text-[9px] font-mono text-gray-500">•</span>
                          <span className="text-[9px] font-mono text-gray-600">{order.quantity}{order.unit}</span>
                          <span className="text-[9px] font-mono text-gray-500">•</span>
                          <span className="text-[9px] font-mono text-gray-600 truncate max-w-[80px]">{order.product}</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Header */}
              <div className="px-4 py-3 border-b border-green-200 bg-white/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-light text-green-600 tracking-wide">INTELLIGENCE TERMINAL</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">Bio Vera Analytics v2.1</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleWhatsAppClick}
                      className="p-1.5 hover:bg-green-50 rounded-lg transition-colors text-green-600 hover:text-green-700"
                      aria-label="Contact via WhatsApp"
                      title="Contact via WhatsApp"
                    >
                      <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
                
                {/* Quick Options - Only when no messages */}
                {messages.length === 0 && !showContactForm && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSend('How do I become a buyer? How can I order products?')}
                      className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all group text-left"
                    >
                      <ShoppingCart className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
                      <span className="text-xs font-light text-gray-700 group-hover:text-green-700">For Buyers</span>
                    </button>
                    <button
                      onClick={() => handleSend('How do I become a grower? How can I join as a producer?')}
                      className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all group text-left"
                    >
                      <Users className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
                      <span className="text-xs font-light text-gray-700 group-hover:text-green-700">For Growers</span>
                    </button>
                    <button
                      onClick={() => handleSend('How do I become a supplier?')}
                      className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all group text-left"
                    >
                      <Package className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
                      <span className="text-xs font-light text-gray-700 group-hover:text-green-700">For Suppliers</span>
                    </button>
                    <button
                      onClick={() => handleSend('How do I become a logistics partner?')}
                      className="flex items-center gap-2 px-3 py-2 border border-green-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all group text-left"
                    >
                      <Truck className="w-4 h-4 text-gray-500 group-hover:text-green-600 transition-colors" strokeWidth={1.5} />
                      <span className="text-xs font-light text-gray-700 group-hover:text-green-700">For Logistics</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white/50 to-white/30">
                {showContactForm ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="text-xs font-light text-green-600 mb-1">Contact Request</h4>
                      <p className="text-[10px] text-gray-600 font-light">
                        Our logistics team will analyze your requirements and provide optimized solutions.
                      </p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-600 mb-1">NAME *</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-xs font-light bg-white"
                          placeholder="Your name"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-600 mb-1">EMAIL *</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-xs font-light bg-white"
                          placeholder="email@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-600 mb-1">PHONE</label>
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-xs font-light bg-white"
                          placeholder="+381 60 123 4567"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-600 mb-1">MESSAGE</label>
                        <textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                          rows={2}
                          className="w-full px-2.5 py-1.5 border border-[#2D5A27]/20 rounded-lg focus:ring-1 focus:ring-[#2D5A27] focus:border-[#2D5A27] outline-none text-xs font-light resize-none bg-white/80"
                          placeholder="Requirements..."
                        />
                      </div>

                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="consent"
                          required
                          checked={contactForm.consentGiven}
                          onChange={(e) => setContactForm(prev => ({ ...prev, consentGiven: e.target.checked }))}
                          className="mt-0.5"
                        />
                        <label htmlFor="consent" className="text-[10px] font-light text-gray-600 leading-relaxed">
                          I consent to be contacted by BioVera logistics team. *
                        </label>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowContactForm(false)}
                          className="flex-1 px-3 py-1.5 border border-[#2D5A27]/20 rounded-lg hover:bg-[#2D5A27]/5 transition-colors text-xs font-light text-gray-700"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={contactSubmitting || !contactForm.consentGiven}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-light"
                        >
                          {contactSubmitting ? 'Submitting...' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                      <Activity className="w-6 h-6 text-green-600" strokeWidth={1} />
                    </div>
                    <h4 className="text-xs font-light text-green-600 mb-1.5">How can I assist you?</h4>
                    <p className="text-[10px] text-gray-500 font-light max-w-xs">
                      Ask about becoming a buyer, grower, supplier, or logistics partner. I'm here to help!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className="space-y-2">
                      {msg.role === 'user' && (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-gray-900 text-white px-3 py-2 rounded-lg border-l-2 border-green-600">
                            <p className="text-xs font-light leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      )}
                      
                      {msg.role === 'assistant' && (
                        <div className="space-y-2">
                          <div className="bg-gray-50 border border-gray-200 border-l-2 border-l-green-600 rounded-lg p-3">
                            <div className="text-xs text-gray-700 font-light leading-relaxed whitespace-pre-wrap">
                              {msg.content.split(/(```[\s\S]*?```|\d+\.?\d*|€\d+\.?\d*|%\d+\.?\d*|kg|L|km|boxes?|pallets?)/g).map((part, i) => {
                                // Format code blocks (monospaced tables)
                                if (part.startsWith('```') && part.endsWith('```')) {
                                  const codeContent = part.slice(3, -3);
                                  return (
                                    <pre key={i} className="font-mono text-[10px] bg-green-50 border border-green-200 rounded p-2 my-2 overflow-x-auto">
                                      <code className="text-green-700">{codeContent}</code>
                                    </pre>
                                  );
                                }
                                // Apply monospaced to numbers, percentages, currency, units
                                if (/^\d+\.?\d*$|^€\d+\.?\d*$|^%\d+\.?\d*$|^kg$|^L$|^km$|^boxes?$|^pallets?$/i.test(part)) {
                                  return <span key={i} className="font-mono font-medium text-green-600">{part}</span>;
                                }
                                return <span key={i}>{part}</span>;
                              })}
                            </div>
                          </div>
                          
                          {/* Quick Actions */}
                          {msg.quickActions && msg.quickActions.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Related Analysis</p>
                              <div className="space-y-1">
                                {msg.quickActions.map((action, actionIdx) => (
                                  <button
                                    key={actionIdx}
                                    onClick={() => handleSend(action.query)}
                                    className="w-full text-left px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg hover:border-green-600 hover:bg-green-50 transition-all text-[10px] font-light text-gray-700 flex items-center justify-between group"
                                  >
                                    <span>{action.label}</span>
                                    <span className="text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Suggested Actions */}
                          {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                            <div className="space-y-1.5">
                              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-wider">Quick Links</p>
                              <div className="space-y-1">
                                {msg.suggestedActions.map((action, actionIdx) => (
                                  <Link
                                    key={actionIdx}
                                    href={action.url}
                                    className="flex items-center justify-between px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-[10px] font-light group"
                                    onClick={() => setIsOpen(false)}
                                  >
                                    <span>{action.label}</span>
                                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">Analyzing...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-green-200 bg-white">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask a question..."
                      disabled={isLoading}
                      className="w-full pl-8 pr-2.5 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-green-600 outline-none text-xs disabled:opacity-50 font-light bg-white"
                    />
                  </div>
                  <button
                    onClick={() => handleSend()}
                    disabled={isLoading || !input.trim()}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
