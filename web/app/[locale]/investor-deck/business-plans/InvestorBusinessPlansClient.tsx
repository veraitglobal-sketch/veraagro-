'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ExternalLink, Eye, EyeOff, FileText, Lock, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ConfidentialTier } from '@/lib/grower-confidential-types';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type TierAvailability = Record<ConfidentialTier, boolean>;

type PerTierUi = {
  phase: 'collapsed' | 'content';
  externalUrl: string | null;
  password: string;
  showPassword: boolean;
  wrongPassword: boolean;
  loading: boolean;
};

function emptyTier(): PerTierUi {
  return {
    phase: 'collapsed',
    externalUrl: null,
    password: '',
    showPassword: false,
    wrongPassword: false,
    loading: false,
  };
}

const btnPrimary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2';
const btnOutline =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2';
const btnIconSubmit =
  'inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] text-white shadow-sm transition-colors hover:bg-[#23471f] hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const inputClass =
  'min-h-[48px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50 disabled:text-gray-500';

/** Google-Docs–style tiles — Vera border + soft lift on hover */
const docCardClass =
  'block overflow-hidden rounded-xl border border-gray-200/90 bg-white text-left shadow-sm ring-1 ring-gray-950/[0.03] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#2D5A27]/28 hover:shadow-md hover:shadow-[#2D5A27]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2';

const TIER_INDEX: Record<ConfidentialTier, string> = {
  short: '01',
  medium: '02',
  long: '03',
  confidential: '04',
};

const TIER_IDS: ConfidentialTier[] = ['short', 'medium', 'long', 'confidential'];

const TITLE_KEY: Record<ConfidentialTier, string> = {
  short: 'investorBusinessPlans.shortTitle',
  medium: 'investorBusinessPlans.mediumTitle',
  long: 'investorBusinessPlans.longTitle',
  confidential: 'investorBusinessPlans.confidentialTitle',
};

const TIER_RESPONSE_KEYS: Record<ConfidentialTier, { url: string; internal: string }> = {
  short: { url: 'shortTermUrl', internal: 'shortTermInternal' },
  medium: { url: 'mediumTermUrl', internal: 'mediumTermInternal' },
  long: { url: 'longTermUrl', internal: 'longTermInternal' },
  confidential: { url: 'confidentialTermUrl', internal: 'confidentialTermInternal' },
};

/** Probe tier cookie: internal plans return 200 with markdown JSON (body unused here). */
async function probeTierUnlocked(
  tier: ConfidentialTier,
  markdownUrl: string,
): Promise<boolean> {
  const res = await fetch(markdownUrl, { credentials: 'include', cache: 'no-store', method: 'GET' });
  return res.ok;
}

export default function InvestorBusinessPlansClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const router = useRouter();
  const unlockEndpoint = useMemo(() => loc('/investor-deck/business-plans/unlock'), [loc]);

  const [bootstrap, setBootstrap] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [tiersConfigured, setTiersConfigured] = useState<TierAvailability | null>(null);
  const [bundleUnlocked, setBundleUnlocked] = useState(false);
  const [gateConfigured, setGateConfigured] = useState(false);

  const [bundlePw, setBundlePw] = useState('');
  const [showBundlePw, setShowBundlePw] = useState(false);
  const [bundleWrong, setBundleWrong] = useState(false);
  const [bundleBusy, setBundleBusy] = useState(false);

  const [tierUi, setTierUi] = useState<Record<ConfidentialTier, PerTierUi>>({
    short: emptyTier(),
    medium: emptyTier(),
    long: emptyTier(),
    confidential: emptyTier(),
  });

  const [pageError, setPageError] = useState<string | null>(null);
  const [docLoadTier, setDocLoadTier] = useState<ConfidentialTier | null>(null);
  const [passwordModalTier, setPasswordModalTier] = useState<ConfidentialTier | null>(null);
  const sessionHydratedRef = useRef(false);
  const setTier = useCallback((tier: ConfidentialTier, patch: Partial<PerTierUi>) => {
    setTierUi((prev) => ({ ...prev, [tier]: { ...prev[tier], ...patch } }));
  }, []);

  const closePasswordModal = useCallback(() => {
    setPasswordModalTier((prev) => {
      if (prev) {
        setTier(prev, { password: '', wrongPassword: false, showPassword: false });
      }
      return null;
    });
  }, [setTier]);

  const loadBootstrap = useCallback(async () => {
    setBootstrap('loading');
    setPageError(null);
    try {
      const res = await fetch(unlockEndpoint, { method: 'GET', cache: 'no-store' });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 404) {
        setPageError(t('investorBusinessPlans.sectionDisabled'));
        setBootstrap('error');
        return;
      }

      const tiers = data.tiersAvailable as TierAvailability | undefined;
      const configured = data.tiersConfigured as TierAvailability | undefined;
      const bu = data.bundleUnlocked === true;
      const gc = data.gateConfigured === true;

      if (
        data.ok === true &&
        tiers &&
        configured &&
        typeof tiers.short === 'boolean' &&
        typeof tiers.medium === 'boolean' &&
        typeof tiers.long === 'boolean' &&
        typeof tiers.confidential === 'boolean' &&
        typeof configured.short === 'boolean' &&
        typeof configured.medium === 'boolean' &&
        typeof configured.long === 'boolean' &&
        typeof configured.confidential === 'boolean'
      ) {
        setTiersConfigured(configured);
        setBundleUnlocked(bu);
        setGateConfigured(gc);
        setBootstrap('ok');
      } else {
        setPageError(t('investorBusinessPlans.errorNetwork'));
        setBootstrap('error');
      }
    } catch {
      setPageError(t('investorBusinessPlans.errorNetwork'));
      setBootstrap('error');
    }
  }, [t, unlockEndpoint]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  useEffect(() => {
    if (bootstrap !== 'ok') return;
    if (!bundleUnlocked) {
      sessionHydratedRef.current = false;
      return;
    }
    if (sessionHydratedRef.current) return;
    sessionHydratedRef.current = true;

    let cancelled = false;
    void (async () => {
      for (const tier of TIER_IDS) {
        if (cancelled) return;
        if (!(tiersConfigured?.[tier] ?? false)) continue;
        setDocLoadTier(tier);
        try {
          const url = loc(`/investor-deck/business-plans/plan-markdown/${tier}`);
          const ok = await probeTierUnlocked(tier, url);
          if (!cancelled && ok) {
            setTier(tier, { phase: 'content', externalUrl: null });
          }
        } finally {
          if (!cancelled) setDocLoadTier(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, bundleUnlocked, tiersConfigured, loc, setTier]);

  useEffect(() => {
    if (passwordModalTier == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePasswordModal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [passwordModalTier, closePasswordModal]);

  const submitBundle = useCallback(async () => {
    const password = bundlePw.trim();
    if (!password) return;
    setBundleBusy(true);
    setBundleWrong(false);
    setPageError(null);
    try {
      const res = await fetch(unlockEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundlePassword: password }),
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 404) {
        setPageError(t('investorBusinessPlans.sectionDisabled'));
        return;
      }
      if (res.status === 503 && data.error === 'gate_not_configured') {
        setPageError(t('investorBusinessPlans.gateNotConfigured'));
        return;
      }
      if (res.status === 401 || data.error === 'wrong_password') {
        setBundleWrong(true);
        return;
      }
      if (data.bundleOk === true) {
        setBundlePw('');
        setBundleUnlocked(true);
        sessionHydratedRef.current = false;
        setTierUi({
          short: emptyTier(),
          medium: emptyTier(),
          long: emptyTier(),
          confidential: emptyTier(),
        });
        return;
      }
      setPageError(t('investorBusinessPlans.errorNetwork'));
    } catch {
      setPageError(t('investorBusinessPlans.errorNetwork'));
    } finally {
      setBundleBusy(false);
    }
  }, [bundlePw, t, unlockEndpoint]);

  const submitTier = useCallback(
    async (tier: ConfidentialTier) => {
      const password = tierUi[tier].password.trim();
      if (!password) return;
      setTier(tier, { loading: true, wrongPassword: false });
      setPageError(null);
      try {
        const res = await fetch(unlockEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier, password }),
          credentials: 'include',
          cache: 'no-store',
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (res.status === 404) {
          setPageError(t('investorBusinessPlans.sectionDisabled'));
          return;
        }
        if (res.status === 403 && data.error === 'bundle_required') {
          setBundleUnlocked(false);
          sessionHydratedRef.current = false;
          setPageError(t('investorBusinessPlans.bundleRequiredAgain'));
          return;
        }
        if (res.status === 401 || data.error === 'wrong_password') {
          setTier(tier, { wrongPassword: true });
          return;
        }

        const keys = TIER_RESPONSE_KEYS[tier];
        const internal = data[keys.internal] === true;
        const rawUrl = data[keys.url];
        const externalUrl =
          typeof rawUrl === 'string' && rawUrl.trim().length > 0 ? rawUrl : null;

        if (!internal && !externalUrl) {
          setTier(tier, { wrongPassword: true });
          return;
        }

        setTier(tier, { password: '', wrongPassword: false, showPassword: false });

        if (internal) {
          setTier(tier, { phase: 'content', externalUrl: null });
          closePasswordModal();
          router.push(loc(`/investor-deck/business-plans/plan/${tier}`));
        } else if (externalUrl) {
          setTier(tier, { phase: 'content', externalUrl });
          closePasswordModal();
          window.open(externalUrl, '_blank', 'noopener,noreferrer');
        }
      } catch {
        setPageError(t('investorBusinessPlans.errorNetwork'));
      } finally {
        setTier(tier, { loading: false });
      }
    },
    [closePasswordModal, loc, router, setTier, t, tierUi, unlockEndpoint],
  );

  const revokeAll = useCallback(async () => {
    try {
      await fetch(`${unlockEndpoint}?scope=${encodeURIComponent('bundle')}`, {
        method: 'DELETE',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      /* still reset */
    }
    setBundleUnlocked(false);
    setBundlePw('');
    setBundleWrong(false);
    sessionHydratedRef.current = false;
    setTierUi({
      short: emptyTier(),
      medium: emptyTier(),
      long: emptyTier(),
      confidential: emptyTier(),
    });
    setPasswordModalTier(null);
  }, [unlockEndpoint]);

  const docThumbLines = (
    <div className="flex flex-col gap-2 px-4 pt-5">
      <div className="h-2 w-[85%] rounded bg-gray-200/90" />
      <div className="h-2 w-full rounded bg-gray-100" />
      <div className="h-2 w-[92%] rounded bg-gray-100" />
      <div className="h-2 w-[60%] rounded bg-gray-100" />
    </div>
  );

  const gateActive = bootstrap === 'ok' && !bundleUnlocked;

  return (
    <div className={`min-h-screen transition-colors ${gateActive ? 'bg-white' : 'bg-gray-50'}`}>
      <header
        className={`fixed top-0 z-50 w-full border-b backdrop-blur-sm ${gateActive ? 'border-gray-100 bg-white/95' : 'border-gray-200 bg-white/80'}`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href={loc('/')} className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Image
              src="/logo1.png"
              alt={t('footer.logoAlt')}
              width={56}
              height={20}
              className="h-4 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-6">
            {bundleUnlocked ? (
              <button
                type="button"
                onClick={() => void revokeAll()}
                className={`${btnOutline} !min-h-[44px] gap-2 px-4 py-2 text-sm`}
              >
                <Lock className="h-4 w-4" aria-hidden />
                {t('investorBusinessPlans.lockAllDocuments')}
              </button>
            ) : null}
            <Link
              href={loc('/investor-deck')}
              className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]"
            >
              {t('investorDeckPage.backToHub')}
            </Link>
            <Link href={loc('/')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
              {t('nav.home')}
            </Link>
          </nav>
        </div>
      </header>

      {pageError ? (
        <div
          className="sticky top-16 z-40 border-b border-red-200 bg-red-50 px-4 py-3 text-center text-base text-red-800"
          role="alert"
        >
          {pageError}
        </div>
      ) : null}

      {passwordModalTier ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/45 p-4 backdrop-blur-[2px]"
          role="presentation"
          onClick={closePasswordModal}
        >
          <div
            role="dialog"
            aria-modal
            aria-labelledby="tier-password-modal-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-[0_24px_64px_-16px_rgba(15,23,42,0.25),0_0_0_1px_rgba(45,90,39,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 bg-[#2D5A27]" aria-hidden />
            <button
              type="button"
              onClick={closePasswordModal}
              className="absolute right-3 top-4 inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40"
              aria-label={t('common.close')}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
            <h2 id="tier-password-modal-title" className="sr-only">
              {t(TITLE_KEY[passwordModalTier])}
            </h2>
            <form
              className="flex flex-col gap-3 px-6 pb-7 pt-8 sm:px-8"
              onSubmit={(e: FormEvent) => {
                e.preventDefault();
                void submitTier(passwordModalTier);
              }}
              noValidate
            >
              <div className="flex w-full gap-2 rounded-xl border border-gray-200/80 bg-gray-50/70 p-2 ring-1 ring-inset ring-gray-200/50">
                {(() => {
                  const ui = tierUi[passwordModalTier];
                  const busy = ui.loading || docLoadTier === passwordModalTier;
                  return (
                    <>
                      <input
                        type={ui.showPassword ? 'text' : 'password'}
                        autoComplete="off"
                        value={ui.password}
                        onChange={(e) => {
                          setTier(passwordModalTier, { password: e.target.value, wrongPassword: false });
                        }}
                        disabled={busy}
                        aria-label={t('investorBusinessPlans.passwordAriaLabel')}
                        aria-invalid={ui.wrongPassword}
                        placeholder=""
                        className={`${inputClass} min-w-0 flex-1 border-gray-200 ${ui.wrongPassword ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setTier(passwordModalTier, { showPassword: !ui.showPassword })}
                        disabled={busy}
                        aria-label={ui.showPassword ? t('grower.confidential.hidePassword') : t('grower.confidential.showPassword')}
                        className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
                      >
                        {ui.showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                      </button>
                      <button
                        type="submit"
                        disabled={busy || !ui.password.trim()}
                        aria-busy={busy}
                        aria-label={busy ? t('investorBusinessPlans.loadingSkeleton') : t('investorBusinessPlans.submitAriaLabel')}
                        className={btnIconSubmit}
                      >
                        {busy ? (
                          <span className="h-5 w-5 animate-pulse rounded-full bg-white/80" aria-hidden />
                        ) : (
                          <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                        )}
                      </button>
                    </>
                  );
                })()}
              </div>
              {tierUi[passwordModalTier].wrongPassword ? (
                <p className="text-sm text-red-700" role="alert">
                  {t('grower.confidential.wrongPassword')}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}

      <main
        className={`mx-auto w-full px-4 pb-16 pt-24 sm:px-6 lg:px-8 ${bundleUnlocked ? 'max-w-7xl' : 'max-w-lg'}`}
        aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
      >
        {bootstrap === 'loading' || bootstrap === 'idle' ? (
          bundleUnlocked ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                  <div className="aspect-[3/4] max-h-56 bg-gray-100" />
                  <div className="h-16 border-t border-gray-100 bg-white" />
                </div>
              ))}
            </div>
          ) : (
            <div className="mx-auto h-14 max-w-md animate-pulse rounded-lg bg-gray-200" aria-hidden />
          )
        ) : bootstrap === 'ok' ? (
          !gateConfigured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
              <p className="text-base leading-relaxed text-amber-950">{t('investorBusinessPlans.gateNotConfigured')}</p>
            </div>
          ) : !bundleUnlocked ? (
            <div className="flex w-full justify-center px-2">
              <div
                className="flex w-full max-w-md flex-col items-center justify-center gap-10 rounded-2xl border border-gray-200/90 bg-white px-7 py-11 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_28px_56px_-32px_rgba(45,90,39,0.14)] min-h-[min(68vh,calc(100dvh-9rem))] sm:min-h-[min(72vh,calc(100dvh-8rem))] sm:px-10 sm:py-12"
              >
                <div className="h-1 w-16 shrink-0 rounded-full bg-[#2D5A27]/85" aria-hidden />
                <Link
                  href={loc('/')}
                  className="flex w-full justify-center transition-opacity hover:opacity-90"
                >
                  <Image
                    src="/logo1.png"
                    alt={t('footer.logoAlt')}
                    width={112}
                    height={40}
                    className="h-9 w-auto sm:h-10"
                    priority
                  />
                </Link>
                <form
                  className="flex w-full flex-col gap-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void submitBundle();
                  }}
                  noValidate
                >
                  <div className="flex w-full gap-2 rounded-xl border border-gray-200/80 bg-gray-50/80 p-2 ring-1 ring-inset ring-gray-200/40">
                    <input
                      type={showBundlePw ? 'text' : 'password'}
                      autoComplete="off"
                      value={bundlePw}
                      onChange={(e) => {
                        setBundlePw(e.target.value);
                        if (bundleWrong) setBundleWrong(false);
                      }}
                      disabled={bundleBusy}
                      aria-label={t('investorBusinessPlans.bundlePasswordLabel')}
                      aria-invalid={bundleWrong}
                      placeholder=""
                      className={`${inputClass} min-w-0 flex-1 border-gray-200 ${bundleWrong ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowBundlePw((s) => !s)}
                      disabled={bundleBusy}
                      aria-label={showBundlePw ? t('grower.confidential.hidePassword') : t('grower.confidential.showPassword')}
                      className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
                    >
                      {showBundlePw ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
                    </button>
                    <button
                      type="submit"
                      disabled={bundleBusy || !bundlePw.trim()}
                      aria-busy={bundleBusy}
                      aria-label={bundleBusy ? t('investorBusinessPlans.loadingSkeleton') : t('investorBusinessPlans.submitAriaLabel')}
                      className={btnIconSubmit}
                    >
                      {bundleBusy ? (
                        <span className="h-5 w-5 animate-pulse rounded-full bg-white/80" aria-hidden />
                      ) : (
                        <ArrowRight className="h-5 w-5 shrink-0" aria-hidden />
                      )}
                    </button>
                  </div>
                  {bundleWrong ? (
                    <p className="text-center text-sm text-red-700" role="alert">
                      {t('grower.confidential.wrongPassword')}
                    </p>
                  ) : null}
                </form>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TIER_IDS.map((tier) => {
                const secretsOk = tiersConfigured?.[tier] ?? false;
                const ui = tierUi[tier];
                const busy = ui.loading || docLoadTier === tier;
                const unlocked = ui.phase === 'content';
                const title = t(TITLE_KEY[tier]);

                if (!secretsOk) {
                  return (
                    <div
                      key={tier}
                      className="overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/80 opacity-80 shadow-sm ring-1 ring-gray-950/[0.03]"
                    >
                      <div className="aspect-[3/4] max-h-56 bg-gray-100/90" />
                      <div className="flex items-center gap-3 border-t border-gray-200 bg-white p-4">
                        <FileText className="h-5 w-5 shrink-0 text-gray-400" aria-hidden />
                        <p className="text-sm text-gray-600">{t('investorBusinessPlans.tierUnavailable')}</p>
                      </div>
                    </div>
                  );
                }

                const thumb = (
                  <div className="relative aspect-[3/4] w-full max-h-56 min-h-[12rem] bg-gradient-to-b from-gray-50 to-white">
                    <div className="absolute left-0 right-0 top-0 h-1 bg-[#2D5A27]" aria-hidden />
                    {docThumbLines}
                    <span className="absolute bottom-3 right-3 text-4xl font-light tabular-nums text-[#2D5A27]/15">
                      {TIER_INDEX[tier]}
                    </span>
                    {!unlocked ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[2px]">
                        <div className="rounded-full border border-gray-200 bg-white p-3 shadow-sm">
                          <Lock className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
                        </div>
                      </div>
                    ) : null}
                  </div>
                );

                const meta = (
                  <div className="flex items-start gap-3 border-t border-gray-200 bg-white p-4">
                    <FileText className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A27]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{title}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {unlocked
                          ? ui.externalUrl
                            ? t('investorBusinessPlans.docOpenExternal')
                            : t('investorBusinessPlans.docOpenFull')
                          : t('investorBusinessPlans.docUnlockCta')}
                      </p>
                    </div>
                  </div>
                );

                if (unlocked && !ui.externalUrl) {
                  return (
                    <Link
                      key={tier}
                      href={loc(`/investor-deck/business-plans/plan/${tier}`)}
                      className={`group ${docCardClass}`}
                    >
                      {thumb}
                      {meta}
                    </Link>
                  );
                }

                if (unlocked && ui.externalUrl) {
                  return (
                    <a
                      key={tier}
                      href={ui.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`group ${docCardClass}`}
                    >
                      {thumb}
                      <div className="flex items-start gap-3 border-t border-gray-200 bg-white p-4">
                        <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-[#2D5A27]" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-gray-900">{title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{t('investorBusinessPlans.docOpenExternal')}</p>
                        </div>
                      </div>
                    </a>
                  );
                }

                return (
                  <button
                    key={tier}
                    type="button"
                    disabled={busy}
                    onClick={() => setPasswordModalTier(tier)}
                    className={`${docCardClass} w-full cursor-pointer disabled:pointer-events-none disabled:opacity-60`}
                  >
                    {thumb}
                    {meta}
                  </button>
                );
              })}
            </div>
          )
        ) : (
          <p className="text-center text-gray-700">{t('investorBusinessPlans.retry')}</p>
        )}

        <p className="sr-only">{t('investorBusinessPlans.ndWarning')}</p>
      </main>
    </div>
  );
}
