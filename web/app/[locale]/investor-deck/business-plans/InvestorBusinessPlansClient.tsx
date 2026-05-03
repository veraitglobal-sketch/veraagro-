'use client';

import { ArrowRight, ExternalLink, Eye, EyeOff, FileText } from 'lucide-react';
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
  'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2';
const btnIconSubmit =
  'inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg bg-[#2D5A27] text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

const paper =
  'rounded-xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/[0.04] sm:p-8 md:p-10';

const TIER_IDS: GrowerConfidentialTierId[] = ['short', 'medium', 'long'];

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
    <div className="min-h-screen bg-[#f6f6f4]">
      {pageError ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-center text-base text-red-900" role="alert">
          {pageError}
        </div>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14" aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}>
        <header className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2D5A27]/80">
            {t('investorBusinessPlans.docSeriesEyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-900 sm:text-3xl">
            {t('investorBusinessPlans.docSeriesTitle')}
          </h1>
          <p className="sr-only">{t('investorBusinessPlans.pageDescription')}</p>
        </header>

        {bootstrap === 'loading' || bootstrap === 'idle' ? (
          <div className="space-y-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`${paper} h-64 animate-pulse bg-gray-100/80`} aria-hidden />
            ))}
          </div>
        ) : bootstrap === 'ok' ? (
          !gateConfigured ? (
            <p className="text-center text-base leading-relaxed text-gray-700">{t('investorBusinessPlans.gateNotConfigured')}</p>
          ) : (
          <div className="flex flex-col gap-10">
            {!bundleUnlocked ? (
              <section className={paper}>
                <h2 className="text-xl font-semibold text-gray-900">{t('investorBusinessPlans.bundleTitle')}</h2>
                <p className="mt-2 text-base leading-relaxed text-gray-600">{t('investorBusinessPlans.bundleHint')}</p>
                <form
                  className="mt-6 flex flex-col gap-4"
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
                      className={`min-h-[48px] flex-1 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50 ${
                        bundleWrong ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:border-[#2D5A27]'
                      }`}
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
              </section>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => void revokeAll()}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-400 bg-white px-4 text-base font-medium text-gray-900 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
                  >
                    {t('investorBusinessPlans.lockAllDocuments')}
                  </button>
                </div>

                {TIER_IDS.map((tier) => {
                  const secretsOk = tiersConfigured?.[tier] ?? false;
                  const ui = tierUi[tier];
                  const busy = ui.loading || docLoadTier === tier;

                  if (!secretsOk) {
                    return (
                      <section key={tier} className={`${paper} border-dashed border-gray-300 bg-gray-50/80`}>
                        <p className="text-center text-base text-gray-700">{t('investorBusinessPlans.tierUnavailable')}</p>
                      </section>
                    );
                  }

                  if (ui.phase === 'content') {
                    return (
                      <section key={tier} className={paper}>
                        <div className="mb-8 flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                              {t('investorBusinessPlans.docConfidentialBadge')}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-gray-900">{t(TITLE_KEY[tier])}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void revokeTier(tier)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-base font-medium text-gray-800 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
                          >
                            {t('grower.confidential.lockAgain')}
                          </button>
                        </div>
                        {busy ? (
                          <p className="text-center text-gray-600">{t('investorBusinessPlans.docLoadingContent')}</p>
                        ) : ui.markdown ? (
                          <PartnerPlanProse markdown={ui.markdown} />
                        ) : ui.externalUrl ? (
                          <div className="flex flex-col items-center gap-4 py-8">
                            <a href={ui.externalUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
                              <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
                              {t('investorBusinessPlans.docOpenExternal')}
                            </a>
                          </div>
                        ) : null}
                        <p className="mt-10 border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
                          {t('investorBusinessPlans.planReaderFooter')}
                        </p>
                      </section>
                    );
                  }

                  if (ui.phase === 'password') {
                    return (
                      <section key={tier} className={paper}>
                        <div className="mb-6">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                            {t('investorBusinessPlans.docConfidentialBadge')}
                          </p>
                          <h2 className="mt-2 text-xl font-semibold text-gray-900">{t(TITLE_KEY[tier])}</h2>
                          <p className="mt-2 text-base text-gray-600">{t(HINT_KEY[tier])}</p>
                        </div>
                        <form
                          className="flex flex-col gap-4"
                          onSubmit={(e: FormEvent) => {
                            e.preventDefault();
                            void submitTier(tier);
                          }}
                          noValidate
                        >
                          <div className="flex gap-2">
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
                              className={`min-h-[48px] flex-1 rounded-lg border px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50 ${
                                ui.wrongPassword ? 'border-red-400 ring-1 ring-red-200' : 'border-gray-300 focus:border-[#2D5A27]'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setTier(tier, { showPassword: !ui.showPassword })}
                              disabled={busy}
                              aria-label={ui.showPassword ? t('grower.confidential.hidePassword') : t('grower.confidential.showPassword')}
                              className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
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
                          {ui.wrongPassword ? (
                            <p className="text-sm text-red-700" role="alert">
                              {t('grower.confidential.wrongPassword')}
                            </p>
                          ) : null}
                          <button
                            type="button"
                            className="self-start text-base font-medium text-[#2D5A27] underline decoration-[#2D5A27]/30 underline-offset-2"
                            onClick={() => setTier(tier, { phase: 'collapsed', password: '', wrongPassword: false })}
                          >
                            {t('investorBusinessPlans.docBackToPreview')}
                          </button>
                        </form>
                      </section>
                    );
                  }

                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setTier(tier, { phase: 'password' })}
                      className="group w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
                    >
                      <section className={`${paper} transition-shadow group-hover:shadow-md`}>
                        <div className="flex flex-col gap-2 border-b border-gray-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                              {t('investorBusinessPlans.docConfidentialBadge')}
                            </p>
                            <h2 className="mt-2 text-xl font-semibold text-gray-900 sm:text-2xl">{t(TITLE_KEY[tier])}</h2>
                          </div>
                          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700">
                            <FileText className="h-4 w-4 text-[#2D5A27]" aria-hidden />
                            {t('investorBusinessPlans.docUnlockCta')}
                          </span>
                        </div>
                        <div className="pt-5 text-base leading-relaxed text-gray-600">
                          <p>{t('investorBusinessPlans.tierHintAfterGate')}</p>
                          <p className="mt-6 text-center text-sm font-medium text-[#2D5A27] group-hover:underline">
                            {t('investorBusinessPlans.docTapToOpen')}
                            <span aria-hidden> →</span>
                          </p>
                        </div>
                      </section>
                    </button>
                  );
                })}
              </>
            )}

            <p className="text-center text-sm text-gray-500">{t('investorBusinessPlans.footerNote')}</p>
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
