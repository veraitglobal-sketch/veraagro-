'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth';
import {
  ShoppingCart,
  CalendarCheck,
  LogIn,
  UserPlus,
  Package,
  Shield,
  Leaf,
  QrCode,
  MapPin,
  Clock,
  Apple,
  Carrot,
  Wheat,
  Box,
  CheckCircle,
  FileCheck,
  Lock,
  FileText,
  ChevronDown,
} from 'lucide-react';
import HarvestCalendar from '@/components/HarvestCalendar';

export default function ForBuyersPage() {
  const { isAuthenticated, user } = useAuth();
  const hasBuyerAccess = isAuthenticated && user?.roles?.includes?.('buyer');
  const ordersHref = hasBuyerAccess ? '/buyer-portal/trade-panel' : '/login?returnTo=/buyer-portal/trade-panel';
  const preOrderHref = isAuthenticated ? '/pre-order-2026' : '/login?returnTo=/pre-order-2026';

  const [interestForm, setInterestForm] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    consentContact: false,
    consentInformator: false,
  });
  const [interestSubmitted, setInterestSubmitted] = useState(false);
  const [interestSubmitting, setInterestSubmitting] = useState(false);

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestForm.consentContact || !interestForm.consentInformator) return;
    setInterestSubmitting(true);
    // Simulate submit; later wire to API
    setTimeout(() => {
      setInterestSubmitted(true);
      setInterestSubmitting(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header – same as Growers / Suppliers: logo + Home only */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image
                src="/logo1.png"
                alt="Bio Vera"
                width={56}
                height={20}
                className="h-4 w-auto"
                priority
              />
            </Link>
            <nav className="flex gap-8 items-center">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-[#2D5A27] hover:bg-[#2D5A27]/10 px-3 py-2 rounded-full transition-colors"
              >
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="pt-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          {/* Hero */}
          <section className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 leading-tight">
            For Buyers
          </h1>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl leading-relaxed">
            Source fresh produce from the Bio Vera network: certified origin and a traceable batch history, not just a listing.
            The full catalog and ordering are in your dashboard after you register.
          </p>

          {/* We are not a simple shop */}
          <div className="mb-8 p-5 border border-gray-200 rounded-xl bg-gray-50/50">
            <p className="text-gray-700 font-light leading-relaxed">
              We are not a standard online store. We work with a clear, transparent process: you see what we offer,
              you provide your company and contact details and consent, and we take every request seriously.
              Read how we operate below and, when ready, express your interest at the bottom of the page so we can get in touch.
            </p>
            <a
              href="#how-we-operate"
              className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-[#2D5A27] hover:text-[#23471f]"
            >
              <FileText className="h-4 w-4" />
              How we operate
              <ChevronDown className="h-4 w-4" />
            </a>
            <a
              href="#express-interest"
              className="inline-flex items-center gap-2 mt-2 ml-0 sm:ml-4 text-sm font-medium text-[#2D5A27] hover:text-[#23471f]"
            >
              Express your interest
              <ChevronDown className="h-4 w-4" />
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {!isAuthenticated && (
              <>
                <Link
                  href="/register/buyer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Register
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </>
            )}
            <Link
              href={ordersHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Place order
            </Link>
            <Link
              href={preOrderHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5 transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              Pre-order 2026
            </Link>
          </div>
        </section>

        {/* How purchases work */}
        <section className="py-12 border-t border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">How purchases work</h2>
          <p className="text-gray-600 mb-8 max-w-2xl">
            From registration to delivery: a simple, transparent process.
          </p>
          <div className="space-y-6">
            {[
              { step: 1, title: 'Register or log in', body: 'Create a buyer account or sign in. Your dashboard gives you access to the full product catalog and ordering tools.' },
              { step: 2, title: 'Browse and order', body: 'In the dashboard you can browse by category (fruits, vegetables, cereals, other), see origin, harvest info, and pricing. Place direct orders or use Pre-order 2026 for seasonal planning.' },
              { step: 3, title: 'Confirm and pay', body: 'Orders are confirmed in Bio Vera. Payment and delivery terms are clear; we work with secure, traceable flows from farm to you.' },
              { step: 4, title: 'Delivery and traceability', body: 'Track your batch via the digital passport. You see where it was harvested, when (harvest period), and how it was handled until delivery.' },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-[#2D5A27] text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {step}
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Products we offer */}
        <section className="py-12 border-t border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Products we offer</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            We deliver a wide range of fresh fruit and vegetables (and cereals) to European markets.
            The full, up-to-date list with varieties, availability, and prices is in your dashboard after registration.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Apple, label: 'Fruits' },
              { icon: Carrot, label: 'Vegetables' },
              { icon: Wheat, label: 'Cereals' },
              { icon: Package, label: 'Other' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <Icon className="h-5 w-5 text-[#2D5A27]" strokeWidth={1.5} />
                <span className="text-sm font-medium text-gray-800">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Log in to your buyer dashboard to see the full catalog, place orders, or submit a pre-order for 2026.
          </p>

          {/* Harvest calendar – when harvest is, why our produce is not in shock */}
          <div className="mt-10 pt-10 border-t border-gray-200">
            <h3 className="text-xl font-light text-gray-900 mb-1">Harvest calendar</h3>
            <HarvestCalendar />
          </div>
        </section>

        {/* Packaging */}
        <section className="py-12 border-t border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Packaging</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            We use standardized, traceable packaging that meets food safety and quality requirements.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <Box className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Bio Vera reusable crates with integrated QR codes where applicable.</span>
            </li>
            <li className="flex items-start gap-2">
              <Box className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Packaging types and options are visible per product in your dashboard.</span>
            </li>
            <li className="flex items-start gap-2">
              <Box className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Compliance with our packaging standards is verified; work bonus applies for proper use.</span>
            </li>
          </ul>
        </section>

        {/* How we operate – informator / transparency */}
        <section id="how-we-operate" className="py-12 border-t border-gray-200 scroll-mt-20">
          <h2 className="text-2xl font-light text-gray-900 mb-2">How we operate</h2>
          <p className="text-xs font-light text-gray-500 uppercase tracking-wide mb-2">Buyer information (informator)</p>
          <p className="text-gray-600 mb-6 max-w-2xl">
            We run a vertically integrated chain: from seed and cultivation to packaging, logistics, and delivery to retail.
          </p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Direct link between certified producers and buyers; no unnecessary intermediaries.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Every batch is documented: harvest date, origin, and handling are recorded and visible.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>Cold chain and logistics are managed to keep produce fresh from field to destination.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <span>We work with clear pricing and settlement: escrow until release conditions are met, then payout to partners under agreed terms.</span>
            </li>
          </ul>
        </section>

        {/* Security and safeguards */}
        <section className="py-12 border-t border-gray-200">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Security and safeguards</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            We protect quality, payments, and data so you can order with confidence.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Lock, title: 'Payments', desc: 'Structured flow: the buyer’s payment is held in escrow through Bio Vera until delivery is confirmed, then goes to grower and logistics partners under contract. We operate as the brand and supply side—no hidden fees; terms are agreed, not a generic “platform” cut.' },
              { icon: FileCheck, title: 'Contracts & compliance', desc: 'Orders and pre-orders are documented. We enforce quality and packaging standards and verify compliance before release.' },
              { icon: Shield, title: 'Quality control', desc: 'Field and quality checks, barcode and GPS validation, and approved inputs only. Unauthorized or non-compliant batches are blocked.' },
              { icon: QrCode, title: 'Traceability', desc: 'Every batch has a unique ID and digital passport. You can verify origin, harvest date, and journey at any time.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3 p-4 border border-gray-200 rounded-lg">
                <Icon className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why us: our produce, fresh, passport */}
        <section className="py-12 border-t border-gray-200 bg-[#2D5A27]/5 rounded-xl px-6">
          <h2 className="text-2xl font-light text-gray-900 mb-2">What you get with Bio Vera</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            Our fruit and vegetables are fresh-harvested, traceable, and backed by a full digital passport.
          </p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Leaf className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Our fruit and vegetables</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Sourced from Bio Vera certified producers. We focus on quality, sustainable growing methods, and compliance with our protocol.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Clock className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Fresh harvested</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Harvests are planned and reported; we aim to move produce from field to market without unnecessary delay so you receive fresh product.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <QrCode className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Product passport</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Each batch has a digital passport with full information: where it was harvested (region, farm), when (harvest date and period), cold chain, compliance, and the full journey from field to delivery.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-[#2D5A27] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-gray-900">Origin and producer</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  You see the farm, region, and producer behind each product. Certifications and quality entries are available in the dashboard when you order.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA repeat */}
        <section className="py-12 border-t border-gray-200 text-center">
          <p className="text-gray-600 mb-4">Ready to order or plan for 2026?</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href={ordersHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] transition-colors"
            >
              <ShoppingCart className="h-4 w-4" />
              Place order
            </Link>
            <Link
              href={preOrderHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-[#2D5A27] text-[#2D5A27] text-sm font-medium rounded-lg hover:bg-[#2D5A27]/5 transition-colors"
            >
              <CalendarCheck className="h-4 w-4" />
              Pre-order 2026
            </Link>
          </div>
        </section>

        {/* Express your interest – contact form at the end */}
        <section id="express-interest" className="py-12 border-t border-gray-200 scroll-mt-20">
          <h2 className="text-2xl font-light text-gray-900 mb-2">Express your interest</h2>
          <p className="text-gray-600 mb-6 max-w-2xl">
            So we can take your request seriously, please leave your company and contact details and confirm that you have read how we operate and agree to be contacted.
          </p>
          {interestSubmitted ? (
            <div className="max-w-xl p-6 border border-[#2D5A27]/30 rounded-xl bg-[#2D5A27]/5">
              <p className="text-gray-800 font-medium mb-1">Thank you.</p>
              <p className="text-sm text-gray-600">
                We have received your details and will be in touch. If you have not yet registered, you can do so to access the full catalog and place orders once your profile is complete.
              </p>
              <Link href="/register/buyer" className="inline-block mt-4 text-sm font-medium text-[#2D5A27] hover:text-[#23471f]">Register as buyer</Link>
            </div>
          ) : (
            <form onSubmit={handleInterestSubmit} className="max-w-xl space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={interestForm.companyName}
                    onChange={(e) => setInterestForm((f) => ({ ...f, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                    placeholder="Your company or trading name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact person <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={interestForm.contactPerson}
                    onChange={(e) => setInterestForm((f) => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                    placeholder="Full name"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={interestForm.email}
                    onChange={(e) => setInterestForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                    placeholder="business@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={interestForm.phone}
                    onChange={(e) => setInterestForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-[#2D5A27]"
                    placeholder="+49 ..."
                  />
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interestForm.consentContact}
                    onChange={(e) => setInterestForm((f) => ({ ...f, consentContact: e.target.checked }))}
                    className="mt-1 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to being contacted by Bio Vera by email and/or phone for the purpose of orders, offers, and business communication. <span className="text-red-500">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={interestForm.consentInformator}
                    onChange={(e) => setInterestForm((f) => ({ ...f, consentInformator: e.target.checked }))}
                    className="mt-1 rounded border-gray-300 text-[#2D5A27] focus:ring-[#2D5A27]"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the buyer information document (informator). I understand how Bio Vera operates and the ordering process. <span className="text-red-500">*</span>{' '}
                    <a href="#how-we-operate" className="text-[#2D5A27] hover:text-[#23471f] underline">Read how we operate</a>
                  </span>
                </label>
              </div>
              <button
                type="submit"
                disabled={interestSubmitting || !interestForm.consentContact || !interestForm.consentInformator}
                className="px-5 py-2.5 bg-[#2D5A27] text-white text-sm font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {interestSubmitting ? 'Sending…' : 'Submit'}
              </button>
            </form>
          )}
        </section>
        </div>

        {/* Footer – same as Growers / Suppliers */}
        <footer className="border-t border-gray-200 py-16 px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12 items-start">
              <div className="flex flex-col">
                <Link href="/" className="inline-block mb-4 -mt-1">
                  <Image
                    src="/logo1.png"
                    alt="Bio Vera"
                    width={56}
                    height={20}
                    className="h-4 w-auto"
                  />
                </Link>
                <p className="text-sm text-gray-600 leading-relaxed">
                  A vertically integrated agricultural network for Bio-Ready certification
                  and EU market compliance.
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/for-buyers" className="hover:text-[#2D5A27] transition-colors">For Buyers</Link></li>
                  <li><Link href="/growers" className="hover:text-[#2D5A27] transition-colors">For Growers</Link></li>
                  <li><Link href="/suppliers" className="hover:text-[#2D5A27] transition-colors">For Suppliers</Link></li>
                  <li><Link href="/logistics-partner" className="hover:text-[#2D5A27] transition-colors">For Logistics</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/#vision" className="hover:text-[#2D5A27] transition-colors">Vision</Link></li>
                  <li><Link href="/#roadmap" className="hover:text-[#2D5A27] transition-colors">Roadmap</Link></li>
                  <li><Link href="/contact" className="hover:text-[#2D5A27] transition-colors">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><Link href="/terms" className="hover:text-[#2D5A27] transition-colors">Terms</Link></li>
                  <li><Link href="/privacy" className="hover:text-[#2D5A27] transition-colors">Privacy</Link></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-8 text-center text-sm text-gray-500">
              <p>&copy; 2026 Bio Vera. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
