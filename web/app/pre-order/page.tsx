'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BrandLogo from '@/components/BrandLogo';
import { useAuth } from '@/lib/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ShoppingBag, Printer, Building2, User, Phone, Mail, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';
import { preOrdersAPI } from '@/lib/api';
import { PRE_ORDER_SEASON } from '@biovera/shared/preorder';

type Variety = { id: string; name: string };
type Article = { id: string; name: string; unit: string; varieties?: Variety[] };

// Products we can deliver in Europe — season pre-order (PRE_ORDER_SEASON). Use varieties for products with multiple sorts.
const CATEGORIES: { id: string; name: string; articles: Article[] }[] = [
  {
    id: 'fruits',
    name: 'Fruits',
    articles: [
      { id: 'apple', name: 'Apple', unit: 'kg', varieties: [{ id: 'golden', name: 'Golden Delicious' }, { id: 'gala', name: 'Gala' }, { id: 'idared', name: 'Idared' }, { id: 'granny', name: 'Granny Smith' }, { id: 'jonagold', name: 'Jonagold' }, { id: 'fuji', name: 'Fuji' }, { id: 'braeburn', name: 'Braeburn' }, { id: 'other', name: 'Other' }] },
      { id: 'pear', name: 'Pear', unit: 'kg', varieties: [{ id: 'conference', name: 'Conference' }, { id: 'williams', name: 'Williams' }, { id: 'abate', name: 'Abate Fetel' }, { id: 'comice', name: 'Comice' }, { id: 'other', name: 'Other' }] },
      { id: 'plum', name: 'Plum', unit: 'kg', varieties: [{ id: 'stanley', name: 'Stanley' }, { id: 'president', name: 'President' }, { id: 'cacak', name: 'Cacak' }, { id: 'other', name: 'Other' }] },
      { id: 'cherry', name: 'Cherry', unit: 'kg', varieties: [{ id: 'sweet', name: 'Sweet' }, { id: 'sour', name: 'Sour' }, { id: 'other', name: 'Other' }] },
      { id: 'peach', name: 'Peach', unit: 'kg', varieties: [{ id: 'yellow', name: 'Yellow' }, { id: 'white', name: 'White' }, { id: 'nectarine', name: 'Nectarine' }, { id: 'other', name: 'Other' }] },
      { id: 'apricot', name: 'Apricot', unit: 'kg', varieties: [{ id: 'bergeron', name: 'Bergeron' }, { id: 'other', name: 'Other' }] },
      { id: 'strawberry', name: 'Strawberry', unit: 'kg', varieties: [{ id: 'elsanta', name: 'Elsanta' }, { id: 'sonata', name: 'Sonata' }, { id: 'other', name: 'Other' }] },
      { id: 'grape', name: 'Grape', unit: 'kg', varieties: [{ id: 'table', name: 'Table grape' }, { id: 'wine', name: 'Wine grape' }, { id: 'other', name: 'Other' }] },
      { id: 'orange', name: 'Orange', unit: 'kg', varieties: [{ id: 'navel', name: 'Navel' }, { id: 'valencia', name: 'Valencia' }, { id: 'blood', name: 'Blood orange' }, { id: 'other', name: 'Other' }] },
      { id: 'nectarine', name: 'Nectarine', unit: 'kg' },
      { id: 'raspberry', name: 'Raspberry', unit: 'kg' },
      { id: 'blackberry', name: 'Blackberry', unit: 'kg' },
      { id: 'blueberry', name: 'Blueberry', unit: 'kg' },
      { id: 'red-currant', name: 'Red currant', unit: 'kg' },
      { id: 'black-currant', name: 'Black currant', unit: 'kg' },
      { id: 'gooseberry', name: 'Gooseberry', unit: 'kg' },
      { id: 'melon', name: 'Melon', unit: 'kg' },
      { id: 'watermelon', name: 'Watermelon', unit: 'kg' },
      { id: 'lemon', name: 'Lemon', unit: 'kg' },
      { id: 'mandarin', name: 'Mandarin', unit: 'kg' },
      { id: 'kiwi', name: 'Kiwi', unit: 'kg' },
      { id: 'fig', name: 'Fig', unit: 'kg' },
      { id: 'pomegranate', name: 'Pomegranate', unit: 'kg' },
      { id: 'quince', name: 'Quince', unit: 'kg' },
      { id: 'persimmon', name: 'Persimmon', unit: 'kg' },
      { id: 'avocado', name: 'Avocado', unit: 'kg' },
    ],
  },
  {
    id: 'vegetables',
    name: 'Vegetables',
    articles: [
      { id: 'tomato', name: 'Tomato', unit: 'kg', varieties: [{ id: 'round', name: 'Round' }, { id: 'cherry', name: 'Cherry' }, { id: 'plum', name: 'Plum / Roma' }, { id: 'beef', name: 'Beefsteak' }, { id: 'other', name: 'Other' }] },
      { id: 'pepper-bell', name: 'Bell pepper', unit: 'kg', varieties: [{ id: 'green', name: 'Green' }, { id: 'red', name: 'Red' }, { id: 'yellow', name: 'Yellow' }, { id: 'orange', name: 'Orange' }, { id: 'other', name: 'Other' }] },
      { id: 'chili-pepper', name: 'Chili pepper', unit: 'kg' },
      { id: 'cucumber', name: 'Cucumber', unit: 'kg', varieties: [{ id: 'greenhouse', name: 'Greenhouse' }, { id: 'field', name: 'Field' }, { id: 'other', name: 'Other' }] },
      { id: 'onion', name: 'Onion', unit: 'kg', varieties: [{ id: 'yellow', name: 'Yellow' }, { id: 'red', name: 'Red' }, { id: 'white', name: 'White' }, { id: 'other', name: 'Other' }] },
      { id: 'garlic', name: 'Garlic', unit: 'kg' },
      { id: 'carrot', name: 'Carrot', unit: 'kg', varieties: [{ id: 'fresh', name: 'Fresh' }, { id: 'storage', name: 'Storage' }, { id: 'other', name: 'Other' }] },
      { id: 'potato', name: 'Potato', unit: 'kg', varieties: [{ id: 'table', name: 'Table' }, { id: 'chipping', name: 'Chipping' }, { id: 'starch', name: 'Starch' }, { id: 'other', name: 'Other' }] },
      { id: 'cabbage', name: 'Cabbage', unit: 'kg', varieties: [{ id: 'white', name: 'White' }, { id: 'red', name: 'Red' }, { id: 'savoy', name: 'Savoy' }, { id: 'other', name: 'Other' }] },
      { id: 'cauliflower', name: 'Cauliflower', unit: 'kg' },
      { id: 'broccoli', name: 'Broccoli', unit: 'kg' },
      { id: 'lettuce', name: 'Lettuce', unit: 'kg', varieties: [{ id: 'iceberg', name: 'Iceberg' }, { id: 'romaine', name: 'Romaine' }, { id: 'leaf', name: 'Leaf' }, { id: 'other', name: 'Other' }] },
      { id: 'spinach', name: 'Spinach', unit: 'kg' },
      { id: 'zucchini', name: 'Zucchini', unit: 'kg' },
      { id: 'eggplant', name: 'Eggplant', unit: 'kg' },
      { id: 'leek', name: 'Leek', unit: 'kg' },
      { id: 'celery', name: 'Celery', unit: 'kg' },
      { id: 'parsnip', name: 'Parsnip', unit: 'kg' },
      { id: 'beetroot', name: 'Beetroot', unit: 'kg' },
      { id: 'radish', name: 'Radish', unit: 'kg' },
      { id: 'green-beans', name: 'Green beans', unit: 'kg' },
      { id: 'peas', name: 'Peas', unit: 'kg' },
      { id: 'asparagus', name: 'Asparagus', unit: 'kg' },
      { id: 'pumpkin', name: 'Pumpkin', unit: 'kg' },
      { id: 'sweet-potato', name: 'Sweet potato', unit: 'kg' },
      { id: 'kale', name: 'Kale', unit: 'kg' },
      { id: 'brussels-sprouts', name: 'Brussels sprouts', unit: 'kg' },
      { id: 'fennel', name: 'Fennel', unit: 'kg' },
      { id: 'artichoke', name: 'Artichoke', unit: 'kg' },
    ],
  },
  {
    id: 'cereals',
    name: 'Cereals & grains',
    articles: [
      { id: 'wheat', name: 'Wheat', unit: 't', varieties: [{ id: 'soft', name: 'Soft wheat' }, { id: 'hard', name: 'Durum wheat' }, { id: 'other', name: 'Other' }] },
      { id: 'corn', name: 'Corn', unit: 't', varieties: [{ id: 'grain', name: 'Grain' }, { id: 'silage', name: 'Silage' }, { id: 'other', name: 'Other' }] },
      { id: 'barley', name: 'Barley', unit: 't', varieties: [{ id: 'malting', name: 'Malting' }, { id: 'feed', name: 'Feed' }, { id: 'other', name: 'Other' }] },
      { id: 'rye', name: 'Rye', unit: 't' },
      { id: 'oats', name: 'Oats', unit: 't' },
      { id: 'rice', name: 'Rice', unit: 't' },
      { id: 'triticale', name: 'Triticale', unit: 't' },
      { id: 'spelt', name: 'Spelt', unit: 't' },
      { id: 'millet', name: 'Millet', unit: 't' },
      { id: 'buckwheat', name: 'Buckwheat', unit: 't' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    articles: [
      { id: 'organic-mix', name: 'Organic mix', unit: 'kg' },
      { id: 'dried-fruits', name: 'Dried fruits', unit: 'kg' },
      { id: 'nuts', name: 'Nuts', unit: 'kg' },
      { id: 'herbs-fresh', name: 'Fresh herbs', unit: 'kg' },
      { id: 'mushrooms', name: 'Mushrooms', unit: 'kg' },
    ],
  },
];

type OrderLine = { id: string; name: string; unit: string; quantity: string };
function getOrderLinesFromCategories(
  categories: typeof CATEGORIES,
  quantities: Record<string, string>
): OrderLine[] {
  const lines: OrderLine[] = [];
  for (const cat of categories) {
    for (const a of cat.articles) {
      if (a.varieties && a.varieties.length > 0) {
        for (const v of a.varieties) {
          const key = `${a.id}_${v.id}`;
          const q = quantities[key]?.trim();
          if (q && Number(q) > 0) lines.push({ id: key, name: `${a.name} – ${v.name}`, unit: a.unit, quantity: q });
        }
      } else {
        const q = quantities[a.id]?.trim();
        if (q && Number(q) > 0) lines.push({ id: a.id, name: a.name, unit: a.unit, quantity: q });
      }
    }
  }
  return lines;
}

const QUALITY_OPTIONS = [
  { id: 'premium', name: 'Premium' },
  { id: 'standard', name: 'Standard' },
];

const PACKAGING_OPTIONS = [
  { id: 'industrial', name: 'Industrial packaging' },
  { id: 'retail', name: 'Retail packaging' },
];

export default function PreOrderPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [deliveryPeriodFrom, setDeliveryPeriodFrom] = useState('');
  const [deliveryPeriodTo, setDeliveryPeriodTo] = useState('');
  const [quality, setQuality] = useState('');
  const [packaging, setPackaging] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || isLoading) return;
    if (!isAuthenticated && !user) {
      router.replace('/login?returnTo=/pre-order');
      return;
    }
  }, [isAuthenticated, user, isLoading, router]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const productKey = (catId: string, articleId: string) => `${catId}_${articleId}`;
  const toggleProduct = (catId: string, articleId: string) => {
    const key = productKey(catId, articleId);
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setQuantity = (id: string, value: string) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  };

  const hasAnyQuantity = () => {
    for (const cat of CATEGORIES) {
      for (const a of cat.articles) {
        if (a.varieties?.length) {
          for (const v of a.varieties) {
            const q = quantities[`${a.id}_${v.id}`]?.trim();
            if (q && Number(q) > 0) return true;
          }
        } else {
          const q = quantities[a.id]?.trim();
          if (q && Number(q) > 0) return true;
        }
      }
    }
    return false;
  };

  const getOrderLines = () => getOrderLinesFromCategories(CATEGORIES, quantities);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSubmitError(null);
    try {
      await preOrdersAPI.create({
        season: PRE_ORDER_SEASON,
        companyName,
        contactPerson,
        email,
        phone: phone || undefined,
        lines: getOrderLines().map((l) => {
          const [productId, varietyId] = l.id.split('_');
          const qty = Number(String(l.quantity).replace(',', '.'));
          return {
            productId,
            ...(varietyId ? { varietyId } : {}),
            label: `${l.name} (${l.quantity} ${l.unit})`,
            quantityKg: l.unit === 't' ? qty * 1000 : qty,
          };
        }),
        deliveryFrom: deliveryPeriodFrom || undefined,
        deliveryTo: deliveryPeriodTo || undefined,
        quality: quality || undefined,
        packaging: packaging || undefined,
        notes: notes || undefined,
      });
      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(' ') : msg || 'The pre-order could not be sent. Please try again or write to info@biovera.app.');
    } finally {
      setSending(false);
    }
  };

  const handlePrint = () => {
    if (typeof window === 'undefined') return;
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pre-order ${PRE_ORDER_SEASON} - Bio Vera</title>
          <style>
            body { font-family: system-ui, sans-serif; padding: 2rem; max-width: 700px; margin: 0 auto; color: #111; font-size: 14px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 2px solid #2D5A27; }
            .logo { height: 36px; width: auto; }
            .doc-title { font-size: 18px; font-weight: 600; color: #2D5A27; }
            table { width: 100%; border-collapse: collapse; }
            th, td { text-align: left; padding: 0.5rem 0.75rem; border-bottom: 1px solid #e5e7eb; }
            th { font-size: 11px; text-transform: uppercase; color: #666; }
            .footer-note { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 11px; color: #666; }
          </style>
        </head>
        <body>
          ${content.innerHTML
            .replace(/<img[^>]+src="([^"]+)"/g, (_, src) => {
              const fullSrc = src.startsWith('http') ? src : window.location.origin + src;
              return `<img src="${fullSrc}" class="logo" alt="Bio Vera" />`;
            })
            .replace(/class="[^"]*"/g, '')
            .replace(/style="[^"]*"/g, '')}
          <p class="footer-note">Pre-order for planning ${PRE_ORDER_SEASON} quantities only. Not a binding order. Bio Vera.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  if (!isAuthenticated && !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Redirecting to login...</p>
      </div>
    );
  }

  const orderLines = getOrderLines();

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-24 pb-12 px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-light text-gray-900 mb-2">Pre-order {PRE_ORDER_SEASON}</h1>
            <p className="text-gray-600 font-light">Detailed pre-order for planning quantities in {PRE_ORDER_SEASON}.</p>

            <div className="mt-6 p-4 rounded-lg border border-amber-200 bg-amber-50/60 text-sm text-amber-900 font-light">
              <p className="leading-relaxed">
                This pre-order is for <strong>planning quantities</strong> for {PRE_ORDER_SEASON} only. It is not a binding order. All details will appear on the printable document.
              </p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                {/* Company and contact */}
                <div className="space-y-4">
                  <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#2D5A27]" />
                    Company and contact
                  </h2>
                  <div className="grid gap-4">
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company name *</label>
                      <input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                        placeholder="e.g. Trade Ltd."
                      />
                    </div>
                    <div>
                      <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 mb-1">Contact person *</label>
                      <input
                        id="contactPerson"
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                        placeholder="Full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                      <input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                        placeholder="+44..."
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                        placeholder="contact@company.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Products by category — expand on click */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-[#2D5A27]" />
                    Products and quantities
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Click a category to open it; click a product with varieties to open its subcategories. Leave blank if you do not order that item.</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                    {CATEGORIES.map((cat) => {
                      const isOpen = expandedCategories.has(cat.id);
                      return (
                        <div key={cat.id}>
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.id)}
                            className={`w-full flex items-center justify-between py-3 px-4 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors ${isOpen ? 'border-b-2 border-[#2D5A27]' : ''}`}
                          >
                            <span className="flex items-center gap-2">
                              {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                              {cat.name}
                            </span>
                          </button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-2 bg-gray-50/50">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b-2 border-[#2D5A27]">
                                        <th className="text-left py-2.5 px-3 font-medium text-gray-700">Product</th>
                                        <th className="text-right py-2.5 px-3 font-medium text-gray-700 w-16">Unit</th>
                                        <th className="text-right py-2.5 px-3 font-medium text-gray-700 w-28">Quantity</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {cat.articles.map((a) => {
                                        const hasVarieties = a.varieties && a.varieties.length > 0;
                                        const isProductOpen = expandedProducts.has(productKey(cat.id, a.id));
                                        if (hasVarieties) {
                                          return (
                                            <React.Fragment key={a.id}>
                                              <tr className="border-b border-gray-100">
                                                <td className="py-2 px-3" colSpan={3}>
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleProduct(cat.id, a.id)}
                                                    className="w-full flex items-center justify-between text-left text-gray-900 font-medium hover:bg-gray-100/70 rounded py-1 pr-2 -mx-2 px-2"
                                                  >
                                                    <span>{a.name}</span>
                                                    <span className="text-gray-400">
                                                      {isProductOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </span>
                                                  </button>
                                                </td>
                                              </tr>
                                                {isProductOpen &&
                                                  a.varieties!.map((v) => (
                                                    <tr key={`${a.id}_${v.id}`} className="border-b border-gray-100 last:border-0 bg-gray-50/30">
                                                      <td className="py-2 px-3 pl-6 text-gray-700 text-sm">{v.name}</td>
                                                      <td className="py-2 px-3 text-right text-gray-600 text-sm">{a.unit}</td>
                                                      <td className="py-2 px-3 text-right">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          step="1"
                                                          value={quantities[`${a.id}_${v.id}`] ?? ''}
                                                          onChange={(e) => setQuantity(`${a.id}_${v.id}`, e.target.value)}
                                                          className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] text-right"
                                                          placeholder="0"
                                                        />
                                                      </td>
                                                    </tr>
                                                  ))}
                                            </React.Fragment>
                                          );
                                        }
                                        return (
                                          <tr key={a.id} className="border-b border-gray-100 last:border-0">
                                            <td className="py-2 px-3 text-gray-900 font-medium">{a.name}</td>
                                            <td className="py-2 px-3 text-right text-gray-600">{a.unit}</td>
                                            <td className="py-2 px-3 text-right">
                                              <input
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={quantities[a.id] ?? ''}
                                                onChange={(e) => setQuantity(a.id, e.target.value)}
                                                className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] text-right inline-block"
                                                placeholder="0"
                                              />
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delivery period */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#2D5A27]" />
                    Approximate delivery period
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={deliveryPeriodFrom}
                      onChange={(e) => setDeliveryPeriodFrom(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] w-36"
                      placeholder={`e.g. Jan ${PRE_ORDER_SEASON}`}
                    />
                    <span className="text-gray-400">–</span>
                    <input
                      type="text"
                      value={deliveryPeriodTo}
                      onChange={(e) => setDeliveryPeriodTo(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27] w-36"
                      placeholder={`e.g. Jun ${PRE_ORDER_SEASON}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Month or period when you want delivery.</p>
                </div>

                {/* Quality and packaging */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                    <div className="space-y-2">
                      {QUALITY_OPTIONS.map((q) => (
                        <label key={q.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="quality" value={q.id} checked={quality === q.id} onChange={() => setQuality(q.id)} className="text-[#2D5A27] focus:ring-[#2D5A27]" />
                          <span className="text-sm">{q.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1"><Package className="h-4 w-4 text-[#2D5A27]" /> Packaging</label>
                    <div className="space-y-2">
                      {PACKAGING_OPTIONS.map((pkg) => (
                        <label key={pkg.id} className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="packaging" value={pkg.id} checked={packaging === pkg.id} onChange={() => setPackaging(pkg.id)} className="text-[#2D5A27] focus:ring-[#2D5A27]" />
                          <span className="text-sm">{pkg.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                    placeholder="Additional requirements..."
                  />
                </div>

                {submitError && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                    {submitError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={sending || !companyName || !contactPerson || !phone || !email || !hasAnyQuantity() || !quality || !packaging}
                  className="w-full py-3 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {sending ? 'Sending...' : 'Submit pre-order'}
                </button>
              </form>
            ) : (
              <div className="mt-8">
                <div className="p-6 rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/5/50 text-center">
                  <p className="text-[#23471f] font-medium">Pre-order received.</p>
                  <p className="text-sm text-[#2D5A27] mt-1 font-light">You can print or save as PDF below.</p>
                </div>

                <div ref={printRef} className="mt-6 border border-gray-200 rounded-lg overflow-hidden bg-white">
                  <div className="p-6">
                    <div className="flex justify-between items-start gap-6 border-b border-gray-200 pb-6 mb-6">
                      <div>
                        <BrandLogo alt="Bio Vera" />
                        <p className="text-xs text-gray-500 mt-2">Pre-order {PRE_ORDER_SEASON} · Planning</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">PRE-ORDER</p>
                        <p className="text-xs text-gray-500">Date: {new Date().toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Customer</p>
                        <p className="font-medium text-gray-900">{companyName}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1 mt-1"><User className="h-3.5 w-3" /> {contactPerson}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1"><Phone className="h-3.5 w-3" /> {phone}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-1"><Mail className="h-3.5 w-3" /> {email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Delivery</p>
                        <p className="text-sm text-gray-700">Period: {deliveryPeriodFrom && deliveryPeriodTo ? `${deliveryPeriodFrom} – ${deliveryPeriodTo}` : deliveryPeriodFrom || deliveryPeriodTo || '—'}</p>
                        <p className="text-sm text-gray-600 mt-1">Quality: {QUALITY_OPTIONS.find((q) => q.id === quality)?.name ?? '—'}</p>
                        <p className="text-sm text-gray-600">Packaging: {PACKAGING_OPTIONS.find((p) => p.id === packaging)?.name ?? '—'}</p>
                      </div>
                    </div>

                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Products and quantities</p>
                    <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                      <thead>
                        <tr className="bg-gray-50 border-b-2 border-[#2D5A27]">
                          <th className="text-left py-2 px-3 font-medium text-gray-700">No.</th>
                          <th className="text-left py-2 px-3 font-medium text-gray-700">Product</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">Unit</th>
                          <th className="text-right py-2 px-3 font-medium text-gray-700">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderLines.map((line, i) => (
                          <tr key={`${line.name}-${line.unit}-${i}`} className="border-t border-gray-100">
                            <td className="py-2 px-3 text-gray-500">{i + 1}</td>
                            <td className="py-2 px-3 text-gray-900">{line.name}</td>
                            <td className="py-2 px-3 text-right text-gray-600">{line.unit}</td>
                            <td className="py-2 px-3 text-right font-medium">{line.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {notes && (
                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{notes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    Print / Save as PDF
                  </button>
                  <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 border border-[#2D5A27] text-[#2D5A27] rounded-lg text-sm font-medium hover:bg-[#2D5A27]/5 transition-colors">
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
