'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, ExternalLink, Eye, EyeOff, FileText, Lock } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { GrowerConfidentialTierId } from '@/components/grower/GrowerConfidentialTierCard';
import { PartnerPlanProse } from '@/components/grower/PartnerPlanProse';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type TierAvailability = Record<GrowerConfidentialTierId, boolean>;

type TierPhase = 'collapsed' | 'password' | 'content';

type PerTierUi = {
  phase: TierPhase;
  markdown: string | null;
  externalUrl: string | null;
  password: string;
  showPassword: boolean;
  wrongPassword: boolean;
  loading: boolean;
};

function emptyTier(): PerTierUi {
  return {
    phase: 'collapsed',
    markdown: null,
    externalUrl: null,
    password: '',
    showPassword: false,
    wrongPassword: false,
    loading: false,
  };
}

/** Bio Vera — usklađeno sa `GrowerConfidentialTierCard` i .cursorrules (jednostavne kartice, #2D5A27) */
const btnPrimary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2';
const btnOutline =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2';
const btnIconSubmit =
  'inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const inputClass =
  'min-h-[48px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors placeholder:text-gray-400 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50 disabled:text-gray-500';

const cardShell =
  'flex min-w-0 flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6';
const tierIconBox =
  'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-[#2D5A27]/10 text-sm font-semibold text-[#2D5A27]';

const TIER_INDEX: Record<GrowerConfidentialTierId, string> = {
  short: '01',
  medium: '02',
  long: '03',
};

const TIER_IDS: GrowerConfidentialTierId[] = ['short', 'medium', 'long'];

function firstConfiguredTier(config: TierAvailability | null | undefined): GrowerConfidentialTierId {
  for (const id of TIER_IDS) {
    if (config?.[id]) return id;
  }
  return 'short';
}

const TITLE_KEY: Record<GrowerConfidentialTierId, string> = {
  short: 'investorBusinessPlans.shortTitle',
  medium: 'investorBusinessPlans.mediumTitle',
  long: 'investorBusinessPlans.longTitle',
};

const HINT_KEY: Record<GrowerConfidentialTierId, string> = {
  short: 'investorBusinessPlans.shortHint',
  medium: 'investorBusinessPlans.mediumHint',
  long: 'investorBusinessPlans.longHint',
};

function tierUrlField(tier: GrowerConfidentialTierId): 'shortTermUrl' | 'mediumTermUrl' | 'longTermUrl' {
  if (tier === 'short') return 'shortTermUrl';
  if (tier === 'medium') return 'mediumTermUrl';
  return 'longTermUrl';
}

function tierInternalField(tier: GrowerConfidentialTierId): 'shortTermInternal' | 'mediumTermInternal' | 'longTermInternal' {
  if (tier === 'short') return 'shortTermInternal';
  if (tier === 'medium') return 'mediumTermInternal';
  return 'longTermInternal';
}

export default function InvestorBusinessPlansClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();
  const unlockEndpoint = useMemo(() => loc('/investor-deck/business-plans/unlock'), [loc]);

  const [bootstrap, setBootstrap] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [tiersConfigured, setTiersConfigured] = useState<TierAvailability | null>(null);
  const [bundleUnlocked, setBundleUnlocked] = useState(false);
  const [gateConfigured, setGateConfigured] = useState(false);

  const [bundlePw, setBundlePw] = useState('');
  const [showBundlePw, setShowBundlePw] = useState(false);
  const [bundleWrong, setBundleWrong] = useState(false);
  const [bundleBusy, setBundleBusy] = useState(false);

  const [tierUi, setTierUi] = useState<Record<GrowerConfidentialTierId, PerTierUi>>({
    short: emptyTier(),
    medium: emptyTier(),
    long: emptyTier(),
  });

  const [pageError, setPageError] = useState<string | null>(null);
  const [docLoadTier, setDocLoadTier] = useState<GrowerConfidentialTierId | null>(null);
  const [activeTier, setActiveTier] = useState<GrowerConfidentialTierId>('short');
  const sessionHydratedRef = useRef(false);

  const setTier = useCallback((tier: GrowerConfidentialTierId, patch: Partial<PerTierUi>) => {
    setTierUi((prev) => ({ ...prev, [tier]: { ...prev[tier], ...patch } }));
  }, []);

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
        typeof configured.short === 'boolean' &&
        typeof configured.medium === 'boolean' &&
        typeof configured.long === 'boolean'
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

  const fetchTierMarkdown = useCallback(
    async (tier: GrowerConfidentialTierId) => {
      const url = loc(`/investor-deck/business-plans/plan-markdown/${tier}`);
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return false;
      const data = (await res.json().catch(() => ({}))) as { markdown?: unknown };
      if (typeof data.markdown !== 'string' || !data.markdown.trim()) return false;
      setTier(tier, { markdown: data.markdown, externalUrl: null, phase: 'content' });
      return true;
    },
    [loc, setTier],
  );

  /** Reload: restore any tier cookies without re-running on each fetch fn identity change. */
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
          await fetchTierMarkdown(tier);
        } finally {
          if (!cancelled) setDocLoadTier(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap, bundleUnlocked, tiersConfigured, fetchTierMarkdown]);

  useEffect(() => {
    if (bootstrap !== 'ok' || !bundleUnlocked || !tiersConfigured) return;
    setActiveTier((at) =>
      tiersConfigured[at] ? at : firstConfiguredTier(tiersConfigured),
    );
  }, [bootstrap, bundleUnlocked, tiersConfigured]);

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
        setTierUi({ short: emptyTier(), medium: emptyTier(), long: emptyTier() });
        setActiveTier(firstConfiguredTier(tiersConfigured));
        return;
      }
      setPageError(t('investorBusinessPlans.errorNetwork'));
    } catch {
      setPageError(t('investorBusinessPlans.errorNetwork'));
    } finally {
      setBundleBusy(false);
    }
  }, [bundlePw, t, tiersConfigured, unlockEndpoint]);

  const submitTier = useCallback(
    async (tier: GrowerConfidentialTierId) => {
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

        const urlKey = tierUrlField(tier);
        const intKey = tierInternalField(tier);
        const internal = data[intKey] === true;
        const externalUrl =
          typeof data[urlKey] === 'string' && (data[urlKey] as string).trim().length > 0
            ? (data[urlKey] as string)
            : null;

        if (!internal && !externalUrl) {
          setTier(tier, { wrongPassword: true });
          return;
        }

        setTier(tier, { password: '', wrongPassword: false });

        if (internal) {
          setDocLoadTier(tier);
          try {
            const loaded = await fetchTierMarkdown(tier);
            if (!loaded && externalUrl) {
              setTier(tier, { externalUrl, markdown: null, phase: 'content' });
            }
            if (!loaded && !externalUrl) {
              setTier(tier, { wrongPassword: true });
            }
          } finally {
            setDocLoadTier(null);
          }
        } else if (externalUrl) {
          setTier(tier, { externalUrl, markdown: null, phase: 'content' });
        }
      } catch {
        setPageError(t('investorBusinessPlans.errorNetwork'));
      } finally {
        setTier(tier, { loading: false });
      }
    },
    [fetchTierMarkdown, setTier, t, tierUi, unlockEndpoint],
  );

  const revokeTier = useCallback(
    async (tier: GrowerConfidentialTierId) => {
      try {
        await fetch(`${unlockEndpoint}?tier=${encodeURIComponent(tier)}`, {
          method: 'DELETE',
          credentials: 'include',
          cache: 'no-store',
        });
      } catch {
        /* still reset */
      }
      setTier(tier, emptyTier());
    },
    [setTier, unlockEndpoint],
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
    setTierUi({ short: emptyTier(), medium: emptyTier(), long: emptyTier() });
  }, [unlockEndpoint]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
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
          <nav className="flex items-center gap-8">
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

      <main
        className="mx-auto w-full max-w-4xl px-6 pb-16 pt-24 lg:px-8"
        aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2D5A27]">
              {t('investorBusinessPlans.docSeriesEyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-light tracking-tight text-gray-900">
              {t('investorBusinessPlans.docSeriesTitle')}
            </h1>
            <p className="mt-2 max-w-3xl text-base font-light leading-relaxed text-gray-700">
              {t('investorBusinessPlans.pageDescription')}
            </p>
          </div>
        </div>

        {bootstrap === 'loading' || bootstrap === 'idle' ? (
          <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100" aria-hidden />
        ) : bootstrap === 'ok' ? (
          !gateConfigured ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-6 shadow-sm">
              <p className="text-base leading-relaxed text-amber-950">{t('investorBusinessPlans.gateNotConfigured')}</p>
            </div>
          ) : (
          <div className="space-y-8">
            {!bundleUnlocked ? (
              <section className={cardShell} aria-labelledby="investor-bp-bundle-title">
                <div className="flex items-start gap-3">
                  <div className={tierIconBox}>
                    <Lock className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#23471f]">
                      {t('investorBusinessPlans.docConfidentialBadge')}
                    </p>
                    <h2 id="investor-bp-bundle-title" className="mt-2 text-lg font-semibold leading-snug text-gray-900">
                      {t('investorBusinessPlans.bundleTitle')}
                    </h2>
                    <p className="mt-1 text-base font-light leading-relaxed text-gray-700">{t('investorBusinessPlans.bundleHint')}</p>

                    <form
                      className="mt-6 flex flex-col gap-3"
                      onSubmit={(e: FormEvent) => {
                        e.preventDefault();
                        void submitBundle();
                      }}
                      noValidate
                    >
                      <div className="flex gap-2">
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
                          placeholder={t('investorBusinessPlans.bundlePasswordLabel')}
                          className={`${inputClass} flex-1 ${bundleWrong ? 'border-red-400 ring-1 ring-red-200' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowBundlePw((s) => !s)}
                          disabled={bundleBusy}
                          aria-label={showBundlePw ? t('grower.confidential.hidePassword') : t('grower.confidential.showPassword')}
                          className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
                        <p className="text-sm text-red-700" role="alert">
                          {t('grower.confidential.wrongPassword')}
                        </p>
                      ) : null}
                    </form>
                  </div>
                </div>
              </section>
            ) : (
              <div className="min-w-0 space-y-6">
                <p className="text-base font-light leading-relaxed text-gray-700">{t('investorBusinessPlans.afterGateLead')}</p>

                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                  <div
                    role="tablist"
                    aria-label={t('investorBusinessPlans.docPickerAria')}
                    className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden"
                  >
                    {TIER_IDS.map((tier) => {
                      const secretsOk = tiersConfigured?.[tier] ?? false;
                      const ui = tierUi[tier];
                      const isActive = activeTier === tier;
                      const unlocked = ui.phase === 'content';
                      return (
                        <button
                          key={tier}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          disabled={!secretsOk}
                          onClick={() => setActiveTier(tier)}
                          className={`inline-flex min-h-[48px] min-w-0 shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors ${
                            !secretsOk
                              ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                              : isActive
                                ? 'border-[#2D5A27] bg-[#2D5A27]/10 text-[#23471f] ring-1 ring-[#2D5A27]/20'
                                : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                              isActive ? 'bg-[#2D5A27] text-white' : 'bg-gray-100 text-[#2D5A27]'
                            }`}
                          >
                            {TIER_INDEX[tier]}
                          </span>
                          <span className="max-w-[9rem] truncate sm:max-w-[12rem]">{t(TITLE_KEY[tier])}</span>
                          {unlocked ? (
                            <Check className="h-4 w-4 shrink-0 text-[#2D5A27]" aria-hidden strokeWidth={2.5} />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeAll()}
                    className={`${btnOutline} shrink-0 px-4 py-2.5 text-sm`}
                  >
                    <Lock className="h-4 w-4 shrink-0 text-gray-600" aria-hidden />
                    {t('investorBusinessPlans.lockAllDocuments')}
                  </button>
                </div>

                {(() => {
                  const tier = activeTier;
                  const secretsOk = tiersConfigured?.[tier] ?? false;
                  const ui = tierUi[tier];
                  const busy = ui.loading || docLoadTier === tier;

                  if (!secretsOk) {
                    return (
                      <section className={`${cardShell} items-center justify-center py-12 text-center`} aria-live="polite">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
                          <Lock className="h-6 w-6 text-gray-400" strokeWidth={1.75} aria-hidden />
                        </div>
                        <p className="max-w-md text-base leading-relaxed text-gray-700">{t('investorBusinessPlans.tierUnavailable')}</p>
                      </section>
                    );
                  }

                  if (ui.phase === 'content') {
                    return (
                      <section
                        className={`${cardShell} min-h-[min(360px,48vh)] gap-0 overflow-hidden p-0 sm:min-h-[min(400px,52vh)]`}
                        aria-live="polite"
                      >
                        <div className="flex flex-col gap-4 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                          <div className="flex min-w-0 items-start gap-3">
                            <span className={tierIconBox}>{TIER_INDEX[tier]}</span>
                            <div className="min-w-0">
                              <h2 className="text-lg font-semibold leading-snug text-gray-900">{t(TITLE_KEY[tier])}</h2>
                              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#23471f]">
                                {t('investorBusinessPlans.docConfidentialBadge')}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void revokeTier(tier)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 sm:w-auto"
                          >
                            {t('grower.confidential.lockAgain')}
                          </button>
                        </div>
                        <div className="min-h-0 max-h-[min(72vh,840px)] flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                          {busy ? (
                            <p className="py-12 text-center text-sm text-gray-600">{t('investorBusinessPlans.docLoadingContent')}</p>
                          ) : ui.markdown ? (
                            <div className="rounded-lg bg-gray-50/60 px-2 py-4 sm:px-4">
                              <PartnerPlanProse markdown={ui.markdown} />
                            </div>
                          ) : ui.externalUrl ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                              <a href={ui.externalUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                                <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
                                {t('investorBusinessPlans.docOpenExternal')}
                              </a>
                            </div>
                          ) : null}
                        </div>
                        <p className="border-t border-gray-200 px-5 py-4 text-center text-xs leading-relaxed text-gray-600 sm:px-6">
                          {t('investorBusinessPlans.planReaderFooter')}
                        </p>
                      </section>
                    );
                  }

                  if (ui.phase === 'password') {
                    return (
                      <section className={cardShell} aria-live="polite">
                        <div className="flex items-start gap-3">
                          <span className={tierIconBox}>{TIER_INDEX[tier]}</span>
                          <div className="min-w-0">
                            <h2 className="text-lg font-semibold leading-snug text-gray-900">{t(TITLE_KEY[tier])}</h2>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#23471f]">
                              {t('investorBusinessPlans.docConfidentialBadge')}
                            </p>
                            <p className="mt-3 text-base font-light leading-relaxed text-gray-700">{t(HINT_KEY[tier])}</p>
                          </div>
                        </div>
                        <form
                          className="flex flex-col gap-3"
                          onSubmit={(e: FormEvent) => {
                            e.preventDefault();
                            void submitTier(tier);
                          }}
                          noValidate
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                            <input
                              type={ui.showPassword ? 'text' : 'password'}
                              autoComplete="off"
                              value={ui.password}
                              onChange={(e) => {
                                setTier(tier, { password: e.target.value, wrongPassword: false });
                              }}
                              disabled={busy}
                              aria-label={t('investorBusinessPlans.passwordAriaLabel')}
                              aria-invalid={ui.wrongPassword}
                              placeholder={t('investorBusinessPlans.passwordAriaLabel')}
                              className={`${inputClass} w-full flex-1 ${
                                ui.wrongPassword ? 'border-red-400 ring-1 ring-red-200' : ''
                              }`}
                            />
                            <div className="flex shrink-0 gap-2 sm:flex-col">
                              <button
                                type="button"
                                onClick={() => setTier(tier, { showPassword: !ui.showPassword })}
                                disabled={busy}
                                aria-label={ui.showPassword ? t('grower.confidential.hidePassword') : t('grower.confidential.showPassword')}
                                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
                            </div>
                          </div>
                          {ui.wrongPassword ? (
                            <p className="text-sm leading-relaxed text-red-700" role="alert">
                              {t('grower.confidential.wrongPassword')}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="self-start text-sm font-medium text-[#2D5A27] underline underline-offset-2 decoration-[#2D5A27]/35 hover:decoration-[#2D5A27]"
                            onClick={() => setTier(tier, { phase: 'collapsed', password: '', wrongPassword: false, showPassword: false })}
                          >
                            {t('investorBusinessPlans.docBackToPreview')}
                          </button>
                        </form>
                      </section>
                    );
                  }

                  return (
                    <button
                      type="button"
                      onClick={() => setTier(tier, { phase: 'password' })}
                      className="group w-full min-w-0 rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27] focus-visible:ring-offset-2"
                    >
                      <div
                        className={`${cardShell} cursor-pointer transition-colors group-hover:border-gray-300 group-hover:bg-gray-50/40`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={tierIconBox}>{TIER_INDEX[tier]}</span>
                          <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-semibold leading-snug text-gray-900">{t(TITLE_KEY[tier])}</h2>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[#23471f]">
                              {t('investorBusinessPlans.docConfidentialBadge')}
                            </p>
                            <p className="mt-3 text-base font-light leading-relaxed text-gray-700">
                              {t('investorBusinessPlans.tierHintAfterGate')}
                            </p>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-[#23471f] group-hover:border-[#2D5A27]/30">
                            <FileText className="h-4 w-4 text-[#2D5A27]" aria-hidden />
                            {t('investorBusinessPlans.docUnlockCta')}
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-base font-medium text-[#2D5A27]">
                          {t('investorBusinessPlans.docTapToOpen')}
                          <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </p>
                      </div>
                    </button>
                  );
                })()}
              </div>
            )}

            <div className="mt-10 border-t border-gray-200 pt-8">
              <p className="text-center text-sm font-light leading-relaxed text-gray-600">{t('investorBusinessPlans.footerNote')}</p>
            </div>
            <p className="sr-only">{t('investorBusinessPlans.ndWarning')}</p>
          </div>
          )
        ) : (
          <p className="text-center text-gray-700">{t('investorBusinessPlans.retry')}</p>
        )}
      </main>
    </div>
  );
}
