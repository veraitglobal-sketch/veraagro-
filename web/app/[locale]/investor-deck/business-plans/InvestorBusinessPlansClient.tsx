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

const btnPrimary =
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white shadow-sm transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2';
const btnIconSubmit =
  'inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] text-white shadow-sm transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
const inputClass =
  'min-h-[48px] rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 shadow-sm placeholder:text-gray-400 transition-colors focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50';

const paper =
  'relative overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-lg shadow-gray-900/[0.04] ring-1 ring-black/[0.03] sm:p-8 md:p-10 p-6';
const paperAccentBar = 'pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#2D5A27] via-[#3d6b32] to-[#5a9048]';

/** Single-document reader surface */
const paperReader =
  'relative flex min-h-[min(420px,52vh)] min-w-0 flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-xl shadow-gray-900/[0.07] ring-1 ring-black/[0.04] sm:min-h-[min(480px,58vh)]';

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
    <div className="relative min-h-screen bg-white">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_100%_60%_at_50%_-15%,rgba(45,90,39,0.11),transparent_50%),radial-gradient(ellipse_70%_45%_at_100%_0%,rgba(45,90,39,0.06),transparent_40%),linear-gradient(180deg,#fafbf9_0%,#ffffff_45%,#f6f8f4_100%)]"
        aria-hidden
      />

      <header className="fixed top-0 z-50 w-full border-b border-gray-200/80 bg-white/85 backdrop-blur-md">
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
          <div className="flex items-center gap-6">
            <Link
              href={loc('/investor-deck')}
              className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]"
            >
              {t('investorDeckPage.backToHub')}
            </Link>
            <Link href={loc('/')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
              {t('nav.home')}
            </Link>
          </div>
        </div>
      </header>

      {pageError ? (
        <div
          className="sticky top-16 z-40 border-b border-red-200/90 bg-red-50/95 px-4 py-3 text-center text-base text-red-900 shadow-sm backdrop-blur-sm"
          role="alert"
        >
          {pageError}
        </div>
      ) : null}

      <div
        className="mx-auto w-full max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24 lg:px-8"
        aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
      >
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <div className="mx-auto rounded-2xl border border-gray-200/90 bg-white/80 px-6 py-8 shadow-sm shadow-gray-900/[0.03] backdrop-blur-sm sm:px-10 sm:py-9">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2D5A27]">
              {t('investorBusinessPlans.docSeriesEyebrow')}
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
              {t('investorBusinessPlans.docSeriesTitle')}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-600">
              {t('investorBusinessPlans.pageDescription')}
            </p>
            <div
              className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-[#2D5A27]/45 to-transparent"
              aria-hidden
            />
          </div>
        </header>

        {bootstrap === 'loading' || bootstrap === 'idle' ? (
          <div className="mx-auto max-w-4xl px-0 sm:px-2">
            <div
              className="h-[min(28rem,70vh)] animate-pulse rounded-2xl bg-gradient-to-br from-gray-100 via-white to-[#f0f4ed] ring-1 ring-gray-200/80"
              aria-hidden
            />
          </div>
        ) : bootstrap === 'ok' ? (
          !gateConfigured ? (
            <div className="mx-auto max-w-xl rounded-2xl border border-amber-200/80 bg-amber-50/50 px-6 py-8 text-center shadow-sm">
              <p className="text-base leading-relaxed text-amber-950/90">{t('investorBusinessPlans.gateNotConfigured')}</p>
            </div>
          ) : (
          <div className="flex flex-col gap-10">
            {!bundleUnlocked ? (
              <div className="mx-auto w-full max-w-3xl">
              <section className={paper}>
                <div className={paperAccentBar} aria-hidden />
                <div className="relative pt-2">
                  <span className="inline-flex rounded-full bg-[#2D5A27]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#23471f]">
                    {t('investorBusinessPlans.docConfidentialBadge')}
                  </span>
                  <h2 className="mt-4 text-2xl font-light text-gray-900">{t('investorBusinessPlans.bundleTitle')}</h2>
                  <p className="mt-3 text-base leading-relaxed text-gray-600">{t('investorBusinessPlans.bundleHint')}</p>
                  <form
                    className="mt-8 flex flex-col gap-4"
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
                      className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
              </section>
              </div>
            ) : (
              <div className="mx-auto min-w-0 max-w-4xl space-y-6">
                <p className="text-center text-sm leading-relaxed text-gray-600 sm:text-base">
                  {t('investorBusinessPlans.afterGateLead')}
                </p>

                <div className="flex flex-col gap-4 rounded-2xl border border-gray-200/95 bg-white p-4 shadow-md shadow-gray-900/[0.05] sm:flex-row sm:items-stretch sm:justify-between sm:gap-5 sm:p-5">
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
                          className={`inline-flex min-h-[48px] min-w-0 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all sm:min-h-[52px] sm:px-4 ${
                            !secretsOk
                              ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-70'
                              : isActive
                                ? 'border-[#2D5A27]/40 bg-[#2D5A27] text-white shadow-md shadow-[#2D5A27]/25'
                                : 'border-gray-200/90 bg-[#fafbf9] text-gray-800 hover:border-[#2D5A27]/28 hover:bg-[#2D5A27]/[0.07]'
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-[#2D5A27] text-white shadow-sm shadow-[#2D5A27]/20'
                            }`}
                          >
                            {TIER_INDEX[tier]}
                          </span>
                          <span className="max-w-[9rem] truncate sm:max-w-[12rem]">{t(TITLE_KEY[tier])}</span>
                          {unlocked ? (
                            <Check
                              className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-[#3d7a36]'}`}
                              aria-hidden
                              strokeWidth={2.5}
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => void revokeAll()}
                    className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 self-stretch rounded-xl border border-[#2D5A27]/30 bg-white px-4 text-sm font-medium text-[#23471f] shadow-sm transition-colors hover:border-[#2D5A27]/50 hover:bg-[#2D5A27]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 sm:self-center"
                  >
                    <Lock className="h-4 w-4 shrink-0" aria-hidden />
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
                      <section
                        className={`${paperReader} items-center justify-center p-10`}
                        aria-live="polite"
                      >
                        <p className="max-w-md text-center text-base text-gray-700">
                          {t('investorBusinessPlans.tierUnavailable')}
                        </p>
                      </section>
                    );
                  }

                  if (ui.phase === 'content') {
                    return (
                      <section className={`${paperReader} gap-0`} aria-live="polite">
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D5A27] via-[#4a7c42] to-[#6bab5c]" aria-hidden />
                        <div className="flex flex-col gap-4 border-b border-gray-100/95 bg-gradient-to-b from-[#fafbf9] to-white px-5 pb-5 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:pb-5 sm:pt-7">
                          <div className="flex min-w-0 items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2D5A27] text-base font-bold text-white shadow-lg shadow-[#2D5A27]/20">
                              {TIER_INDEX[tier]}
                            </span>
                            <div className="min-w-0">
                              <span className="inline-flex rounded-full bg-[#2D5A27]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#23471f]">
                                {t('investorBusinessPlans.docConfidentialBadge')}
                              </span>
                              <p className="mt-2 text-lg font-semibold text-gray-900">{t(TITLE_KEY[tier])}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => void revokeTier(tier)}
                            className="inline-flex min-h-[48px] w-full shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-[#23471f] shadow-sm transition-colors hover:border-[#2D5A27]/30 hover:bg-[#2D5A27]/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/35 focus-visible:ring-offset-2 sm:w-auto"
                          >
                            {t('grower.confidential.lockAgain')}
                          </button>
                        </div>
                        <div className="min-h-0 max-h-[min(72vh,840px)] flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
                          {busy ? (
                            <p className="py-12 text-center text-sm text-gray-600">{t('investorBusinessPlans.docLoadingContent')}</p>
                          ) : ui.markdown ? (
                            <div className="rounded-xl bg-[#fafbf9]/40 px-1 ring-1 ring-gray-100/80 sm:px-2">
                              <PartnerPlanProse markdown={ui.markdown} />
                            </div>
                          ) : ui.externalUrl ? (
                            <div className="flex flex-col items-center gap-4 py-10">
                              <a href={ui.externalUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                                <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
                                {t('investorBusinessPlans.docOpenExternal')}
                              </a>
                            </div>
                          ) : null}
                        </div>
                        <p className="shrink-0 border-t border-gray-100 px-5 py-4 text-center text-xs leading-relaxed text-gray-500 sm:px-7">
                          {t('investorBusinessPlans.planReaderFooter')}
                        </p>
                      </section>
                    );
                  }

                  if (ui.phase === 'password') {
                    return (
                      <section
                        className={`${paperReader} gap-5 p-6 ring-2 ring-[#2D5A27]/18 sm:p-8`}
                        aria-live="polite"
                      >
                        <div className="flex items-start gap-4">
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2D5A27] text-base font-bold text-white shadow-lg shadow-[#2D5A27]/20">
                            {TIER_INDEX[tier]}
                          </span>
                          <div className="min-w-0">
                            <span className="inline-flex rounded-full bg-[#2D5A27]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#23471f]">
                              {t('investorBusinessPlans.docConfidentialBadge')}
                            </span>
                            <h2 className="mt-2 text-xl font-semibold text-gray-900">{t(TITLE_KEY[tier])}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-gray-600 sm:text-base">{t(HINT_KEY[tier])}</p>
                          </div>
                        </div>
                        <form
                          className="flex flex-col gap-4"
                          onSubmit={(e: FormEvent) => {
                            e.preventDefault();
                            void submitTier(tier);
                          }}
                          noValidate
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
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
                                className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-[#2D5A27]/25 hover:bg-[#fafbf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
                            <p className="text-sm text-red-700" role="alert">
                              {t('grower.confidential.wrongPassword')}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="self-start text-sm font-medium text-[#2D5A27] underline decoration-[#2D5A27]/30 underline-offset-2 hover:decoration-[#2D5A27]"
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
                      className="group w-full min-w-0 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/45 focus-visible:ring-offset-2"
                    >
                      <section
                        className={`${paperReader} cursor-pointer gap-6 bg-gradient-to-br from-white via-white to-[#f4f7f2] p-8 transition-all duration-200 group-hover:border-[#2D5A27]/35 group-hover:shadow-[#2D5A27]/10 sm:p-10`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2D5A27] text-base font-bold text-white shadow-lg shadow-[#2D5A27]/22">
                              {TIER_INDEX[tier]}
                            </span>
                            <div className="min-w-0">
                              <span className="inline-flex rounded-full bg-[#2D5A27]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#23471f]">
                                {t('investorBusinessPlans.docConfidentialBadge')}
                              </span>
                              <h2 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">{t(TITLE_KEY[tier])}</h2>
                            </div>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[#2D5A27]/25 bg-[#2D5A27]/[0.08] px-4 py-2 text-sm font-semibold text-[#1d3f19] sm:self-center">
                            <FileText className="h-4 w-4" aria-hidden />
                            {t('investorBusinessPlans.docUnlockCta')}
                          </span>
                        </div>
                        <p className="max-w-2xl text-base leading-relaxed text-gray-600">{t('investorBusinessPlans.tierHintAfterGate')}</p>
                        <p className="flex items-center gap-2 pt-2 text-base font-semibold text-[#2D5A27] group-hover:gap-3">
                          {t('investorBusinessPlans.docTapToOpen')}
                          <ChevronRight className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden />
                        </p>
                      </section>
                    </button>
                  );
                })()}
              </div>
            )}

            <div className="mx-auto mt-2 max-w-2xl border-t border-gray-200/80 pt-10 text-center">
              <p className="text-sm font-light leading-relaxed text-gray-500">{t('investorBusinessPlans.footerNote')}</p>
            </div>
            <p className="sr-only">{t('investorBusinessPlans.ndWarning')}</p>
          </div>
          )
        ) : (
          <p className="text-center text-gray-600">{t('investorBusinessPlans.retry')}</p>
        )}
      </div>
    </div>
  );
}
