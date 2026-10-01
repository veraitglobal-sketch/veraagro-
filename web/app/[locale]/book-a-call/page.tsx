'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDays, Clock, Globe2, BadgeEuro, UserRound, Mail, Phone, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';
import { useAuth } from '@/lib/auth';
import Footer from '@/components/Footer';
import { WEB_CALENDLY_URLS } from '@/lib/book-call';
import {
  BOOK_CALL_ROLES,
  type BookCallRole,
  bookCallRoleFromUserRoles,
  buildCalendlyLink,
  calendlyUrlForRole,
  isBookCallRole,
} from '@biovera/shared/book-call';

export default function BookCallPage() {
  const { t, i18n } = useTranslation();
  const loc = useLocalizedHref();
  const { user } = useAuth();
  // Read ?role= / ?from= after mount (no Suspense boundary → no hydration mismatch with the locale switch).
  const [query, setQuery] = useState<{ role: string | null; from: string | null }>({ role: null, from: null });
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setQuery({ role: sp.get('role'), from: sp.get('from') });
  }, []);
  const lang = i18n.language?.split('-')[0] || 'en';

  const presetRole = useMemo<BookCallRole | null>(() => {
    if (isBookCallRole(query.role)) return query.role;
    return bookCallRoleFromUserRoles(user?.roles);
  }, [query.role, user?.roles]);

  const [role, setRole] = useState<BookCallRole | null>(presetRole);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [scheduled, setScheduled] = useState(false);
  const [embedDomain, setEmbedDomain] = useState<string | null>(null);

  useEffect(() => {
    setRole((current) => current ?? presetRole);
  }, [presetRole]);

  useEffect(() => {
    setEmbedDomain(window.location.hostname);
  }, []);

  // Calendly reports a finished booking via postMessage from the iframe.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (typeof e.origin !== 'string' || !e.origin.endsWith('calendly.com')) return;
      const event = (e.data as { event?: string } | null)?.event;
      if (event === 'calendly.event_scheduled') setScheduled(true);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const baseUrl = role ? calendlyUrlForRole(role, WEB_CALENDLY_URLS) : null;
  const linkOpts = role && baseUrl
    ? {
        baseUrl,
        role,
        name: user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : null,
        email: (user as { email?: string | null } | null)?.email ?? null,
        language: lang,
        sourcePage: query.from || '/book-a-call',
      }
    : null;
  const embedUrl = linkOpts && embedDomain ? buildCalendlyLink({ ...linkOpts, embedDomain }) : null;
  const newTabUrl = linkOpts ? buildCalendlyLink(linkOpts) : null;

  const expectRows = [
    { icon: Clock, title: t('bookCall.expectDurationTitle'), body: t('bookCall.expectDurationBody') },
    { icon: Globe2, title: t('bookCall.expectLanguagesTitle'), body: t('bookCall.expectLanguagesBody') },
    { icon: BadgeEuro, title: t('bookCall.expectFreeTitle'), body: t('bookCall.expectFreeBody') },
    { icon: UserRound, title: t('bookCall.expectWhoTitle'), body: t('bookCall.expectWhoBody') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <main className="pt-24 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-4">{t('bookCall.heroTitle')}</h1>
            <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">{t('bookCall.heroSubtitle')}</p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 lg:order-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="bg-gray-50 border border-gray-200 rounded-lg p-6 md:p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <CalendarDays className="w-5 h-5 text-[#2D5A27]" />
                  <h2 className="text-2xl font-light text-gray-900">{t('bookCall.cardTitle')}</h2>
                </div>

                {scheduled ? (
                  <div className="py-10 text-center space-y-4">
                    <CheckCircle2 className="w-12 h-12 text-[#2D5A27] mx-auto" />
                    <h3 className="text-xl font-light text-gray-900">{t('bookCall.thanksTitle')}</h3>
                    <p className="text-gray-600 font-light max-w-md mx-auto">{t('bookCall.thanksBody')}</p>
                    <Link
                      href={loc('/')}
                      className="inline-flex min-h-[44px] items-center rounded-lg bg-[#2D5A27] px-6 text-sm font-medium text-white hover:bg-[#23471f] transition-colors"
                    >
                      {t('bookCall.backHome')}
                    </Link>
                  </div>
                ) : !role ? (
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-900 mb-4">{t('bookCall.roleQuestion')}</legend>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {BOOK_CALL_ROLES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            setFrameLoaded(false);
                            setRole(r);
                          }}
                          className="text-left rounded-lg border border-gray-300 bg-white px-4 py-3 hover:border-[#2D5A27] hover:bg-[#2D5A27]/5 focus:outline-none focus:ring-2 focus:ring-[#2D5A27] transition-colors"
                        >
                          <span className="block text-sm font-medium text-gray-900">{t(`bookCall.role.${r}`)}</span>
                          <span className="block text-xs font-light text-gray-600 mt-1">{t(`bookCall.roleHint.${r}`)}</span>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                ) : !baseUrl ? (
                  <p className="text-gray-600 font-light">{t('bookCall.notConfigured')}</p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <p className="text-gray-700">
                        {t('bookCall.talkingAs')}{' '}
                        <span className="font-medium text-[#2D5A27]">{t(`bookCall.role.${role}`)}</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setFrameLoaded(false);
                          setRole(null);
                        }}
                        className="text-[#2D5A27] hover:underline"
                      >
                        {t('bookCall.changeRole')}
                      </button>
                    </div>
                    <p className="text-xs font-light text-gray-500">{t('bookCall.privacyNote')}</p>
                    <div className="relative w-full" style={{ minHeight: 700 }}>
                      {!frameLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          <Loader2 className="w-6 h-6 animate-spin text-[#2D5A27]" aria-hidden />
                          <span className="sr-only">{t('bookCall.loading')}</span>
                        </div>
                      )}
                      {embedUrl && (
                        <iframe
                          key={embedUrl}
                          src={embedUrl}
                          title={t('bookCall.cardTitle')}
                          onLoad={() => setFrameLoaded(true)}
                          className="w-full border-0 bg-transparent"
                          style={{ height: 700 }}
                          loading="lazy"
                        />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
              {role && newTabUrl && !scheduled && (
                <p className="mt-4 text-center text-sm text-gray-500 font-light">
                  {t('bookCall.fallbackPrefix')}{' '}
                  <a href={newTabUrl} target="_blank" rel="noopener noreferrer" className="text-[#2D5A27] hover:underline">
                    {t('bookCall.fallbackLink')}
                  </a>{' '}
                  {t('bookCall.fallbackOr')}{' '}
                  <a href="mailto:info@biovera.app" className="text-[#2D5A27] hover:underline">
                    info@biovera.app
                  </a>
                  .
                </p>
              )}
            </div>

            <div className="lg:col-span-1 lg:order-1 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                <h2 className="text-2xl font-light text-gray-900 mb-6">{t('bookCall.expectTitle')}</h2>
                <div className="space-y-6">
                  {expectRows.map(({ icon: Icon, title, body }) => (
                    <div key={title} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-[#2D5A27]/10 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-[#2D5A27]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{title}</h3>
                        <p className="text-sm text-gray-600 font-light">{body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="pt-6 border-t border-gray-200 space-y-4"
              >
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <Mail className="w-4 h-4 text-[#2D5A27]" />
                  <a href="mailto:info@biovera.app" className="hover:text-[#2D5A27]">info@biovera.app</a>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-light">
                  <Phone className="w-4 h-4 text-[#2D5A27]" />
                  <a href="tel:+4915563740470" className="hover:text-[#2D5A27]">+49 155 63740470</a>
                </div>
                <h3 className="text-sm font-medium text-gray-900 pt-2">{t('contactPage.quickLinks')}</h3>
                <ul className="space-y-2">
                  {[
                    ['/contact', t('nav.contact')],
                    ['/faq', t('footer.faq')],
                    ['/for-growers', t('nav.forGrowers')],
                    ['/for-buyers', t('nav.forBuyers')],
                    ['/suppliers', t('nav.forSuppliers')],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={loc(href)} className="text-sm text-gray-600 font-light hover:text-[#2D5A27] transition-colors">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
