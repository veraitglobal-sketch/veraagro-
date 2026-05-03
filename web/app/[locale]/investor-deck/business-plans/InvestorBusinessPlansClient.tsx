'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Footer from '@/components/Footer';
import GrowerConfidentialTierCard, {
  type GrowerConfidentialTierId,
} from '@/components/grower/GrowerConfidentialTierCard';
import { Shield } from 'lucide-react';
import { useLocalizedHref } from '@/hooks/useLocalizedHref';

type TierAvailability = Record<GrowerConfidentialTierId, boolean>;

type TierUnlock = {
  internalPath: string | null;
  externalUrl: string | null;
};

function internalPlanPath(loc: (p: string) => string, tier: GrowerConfidentialTierId): string {
  return loc(`/investor-deck/business-plans/plan/${tier}`);
}

export default function InvestorBusinessPlansClient() {
  const { t } = useTranslation();
  const loc = useLocalizedHref();

  const [shortPw, setShortPw] = useState('');
  const [mediumPw, setMediumPw] = useState('');
  const [longPw, setLongPw] = useState('');
  const [showShort, setShowShort] = useState(false);
  const [showMedium, setShowMedium] = useState(false);
  const [showLong, setShowLong] = useState(false);

  const [bootstrap, setBootstrap] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [bootstrapErrorRecoverable, setBootstrapErrorRecoverable] = useState(false);
  const [tiersConfigured, setTiersConfigured] = useState<TierAvailability | null>(null);
  const [tiersAvailable, setTiersAvailable] = useState<TierAvailability | null>(null);

  const [unlocked, setUnlocked] = useState<Record<GrowerConfidentialTierId, TierUnlock | null>>({
    short: null,
    medium: null,
    long: null,
  });
  const [loadingTier, setLoadingTier] = useState<GrowerConfidentialTierId | null>(null);
  const [errorTier, setErrorTier] = useState<GrowerConfidentialTierId | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const loadBootstrap = useCallback(async () => {
    setBootstrap('loading');
    setPageError(null);
    setBootstrapErrorRecoverable(false);
    try {
      const res = await fetch('/api/investor/business-plans', {
        method: 'GET',
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 404) {
        setPageError(t('investorBusinessPlans.sectionDisabled'));
        setBootstrapErrorRecoverable(false);
        setBootstrap('error');
        return;
      }

      const tiers = data.tiersAvailable as TierAvailability | undefined;
      const configured = data.tiersConfigured as TierAvailability | undefined;

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
        setTiersAvailable(tiers);
        setBootstrap('ok');
      } else {
        setPageError(t('investorBusinessPlans.errorNetwork'));
        setBootstrapErrorRecoverable(true);
        setBootstrap('error');
      }
    } catch {
      setPageError(t('investorBusinessPlans.errorNetwork'));
      setBootstrapErrorRecoverable(true);
      setBootstrap('error');
    }
  }, [t]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const revokeTierSession = useCallback(async (tier: GrowerConfidentialTierId) => {
    try {
      await fetch(`/api/investor/business-plans?tier=${encodeURIComponent(tier)}`, {
        method: 'DELETE',
        cache: 'no-store',
        credentials: 'include',
      });
    } catch {
      /* still collapse UI */
    }
    setUnlocked((prev) => ({ ...prev, [tier]: null }));
  }, []);

  const fetchUnlock = useCallback(
    async (tier: GrowerConfidentialTierId, password: string) => {
      setLoadingTier(tier);
      setErrorTier(null);
      setPageError(null);
      try {
        const body = {
          passwords: {
            ...(tier === 'short' ? { short: password } : {}),
            ...(tier === 'medium' ? { medium: password } : {}),
            ...(tier === 'long' ? { long: password } : {}),
          },
        };
        const res = await fetch('/api/investor/business-plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          cache: 'no-store',
          credentials: 'include',
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (res.status === 404) {
          setPageError(t('investorBusinessPlans.sectionDisabled'));
          return;
        }

        const internal =
          tier === 'short'
            ? data.shortTermInternal === true
            : tier === 'medium'
              ? data.mediumTermInternal === true
              : data.longTermInternal === true;

        const urlKey =
          tier === 'short' ? 'shortTermUrl' : tier === 'medium' ? 'mediumTermUrl' : 'longTermUrl';
        const externalUrl =
          typeof data[urlKey] === 'string' && (data[urlKey] as string).trim().length > 0
            ? (data[urlKey] as string)
            : null;

        if (!internal && !externalUrl) {
          setErrorTier(tier);
          return;
        }

        setUnlocked((prev) => ({
          ...prev,
          [tier]: {
            internalPath: internal ? internalPlanPath(loc, tier) : null,
            externalUrl,
          },
        }));
        if (tier === 'short') setShortPw('');
        if (tier === 'medium') setMediumPw('');
        if (tier === 'long') setLongPw('');
      } catch {
        setPageError(t('investorBusinessPlans.errorNetwork'));
      } finally {
        setLoadingTier(null);
      }
    },
    [loc, t],
  );

  const tiers = useMemo(
    () =>
      [
        {
          id: 'short' as const,
          titleKey: 'grower.confidential.shortTitle',
          hintKey: 'investorBusinessPlans.shortHint',
          password: shortPw,
          setPassword: setShortPw,
          show: showShort,
          setShow: setShowShort,
        },
        {
          id: 'medium' as const,
          titleKey: 'grower.confidential.mediumTitle',
          hintKey: 'investorBusinessPlans.mediumHint',
          password: mediumPw,
          setPassword: setMediumPw,
          show: showMedium,
          setShow: setShowMedium,
        },
        {
          id: 'long' as const,
          titleKey: 'grower.confidential.longTitle',
          hintKey: 'investorBusinessPlans.longHint',
          password: longPw,
          setPassword: setLongPw,
          show: showLong,
          setShow: setShowLong,
        },
      ] as const,
    [shortPw, mediumPw, longPw, showShort, showMedium, showLong],
  );

  const sharedCardStrings = useMemo(
    () => ({
      unavailableLabel: t('investorBusinessPlans.tierUnavailable'),
      passwordLabel: t('grower.confidential.passwordLabel'),
      passwordPlaceholder: t('grower.confidential.passwordPlaceholder'),
      unlockLabel: t('grower.confidential.unlock'),
      unlockingLabel: t('grower.confidential.unlocking'),
      wrongPasswordLabel: t('grower.confidential.wrongPassword'),
      openPresentationLabel: t('grower.confidential.openPresentation'),
      openExternalLinkLabel: t('grower.confidential.openExternalLink'),
      refreshClearsLabel: t('grower.confidential.refreshClears'),
      lockAgainLabel: t('grower.confidential.lockAgain'),
      showPasswordLabel: t('grower.confidential.showPassword'),
      hidePasswordLabel: t('grower.confidential.hidePassword'),
    }),
    [t],
  );

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
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
              <Link href={loc('/investor-deck')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
                {t('investorDeckPage.backToHub')}
              </Link>
              <Link href={loc('/')} className="text-sm text-gray-600 transition-colors hover:text-[#2D5A27]">
                {t('nav.home')}
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="pb-24 pl-6 pr-6 pt-32 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-3 text-4xl font-light text-gray-900">{t('investorBusinessPlans.pageTitle')}</h1>
          <p className="mb-10 max-w-3xl text-lg font-light leading-relaxed text-gray-600">
            {t('investorBusinessPlans.pageDescription')}
          </p>

          <div className="mb-8 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5">
            <div className="hidden shrink-0 sm:flex sm:h-12 sm:w-12 sm:items-center sm:justify-center sm:rounded-lg sm:bg-amber-100/80">
              <Shield className="h-7 w-7 text-amber-900/70" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-base leading-relaxed text-amber-950">{t('investorBusinessPlans.ndWarning')}</p>
          </div>

          {pageError ? (
            <div
              className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-base leading-relaxed text-red-900 sm:p-5"
              role="alert"
            >
              <p>{pageError}</p>
              {bootstrap === 'error' && bootstrapErrorRecoverable ? (
                <button
                  type="button"
                  onClick={() => loadBootstrap()}
                  className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-red-300 bg-white px-4 py-2 text-base font-medium text-red-900 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
                >
                  {t('investorBusinessPlans.retry')}
                </button>
              ) : null}
            </div>
          ) : null}

          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
            aria-label={
              bootstrap === 'loading' || bootstrap === 'idle'
                ? t('investorBusinessPlans.loadingSkeleton')
                : undefined
            }
          >
            {bootstrap === 'loading' || bootstrap === 'idle'
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-[280px] animate-pulse rounded-xl border border-gray-200 bg-gray-100/80 sm:h-[300px]"
                    aria-hidden
                  />
                ))
              : bootstrap === 'ok'
                ? tiers.map(({ id, titleKey, hintKey, password, setPassword, show, setShow }) => {
                    const secretsOk = tiersConfigured?.[id] ?? false;
                    const unlockAllowed = tiersAvailable?.[id] ?? false;
                    const u = unlocked[id];
                    const busy = loadingTier === id;

                    return (
                      <GrowerConfidentialTierCard
                        key={id}
                        tierId={id}
                        title={t(titleKey)}
                        hint={t(hintKey)}
                        tierSecretsConfigured={secretsOk}
                        tenureBlocked={false}
                        unlockPresentationHref={u?.internalPath ?? null}
                        unlockExternalHref={u?.externalUrl ?? null}
                        password={password}
                        onPasswordChange={(v) => {
                          setPassword(v);
                          if (errorTier === id) setErrorTier(null);
                        }}
                        showPassword={show}
                        onToggleShowPassword={() => setShow((s) => !s)}
                        wrongPassword={errorTier === id}
                        loading={busy}
                        onUnlock={() => fetchUnlock(id, password.trim())}
                        onLockAgain={() => revokeTierSession(id)}
                        unavailableLabel={sharedCardStrings.unavailableLabel}
                        passwordLabel={sharedCardStrings.passwordLabel}
                        passwordPlaceholder={sharedCardStrings.passwordPlaceholder}
                        unlockLabel={sharedCardStrings.unlockLabel}
                        unlockingLabel={sharedCardStrings.unlockingLabel}
                        wrongPasswordLabel={sharedCardStrings.wrongPasswordLabel}
                        openPresentationLabel={sharedCardStrings.openPresentationLabel}
                        openExternalLinkLabel={sharedCardStrings.openExternalLinkLabel}
                        refreshClearsLabel={sharedCardStrings.refreshClearsLabel}
                        lockAgainLabel={sharedCardStrings.lockAgainLabel}
                        showPasswordLabel={sharedCardStrings.showPasswordLabel}
                        hidePasswordLabel={sharedCardStrings.hidePasswordLabel}
                      />
                    );
                  })
                : null}
          </div>

          {bootstrap === 'ok' ? (
            <p className="mt-8 max-w-3xl text-sm leading-relaxed text-gray-600">
              {t('investorBusinessPlans.footerNote')}
            </p>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
