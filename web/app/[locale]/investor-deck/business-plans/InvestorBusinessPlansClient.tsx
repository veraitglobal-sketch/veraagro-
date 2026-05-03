'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import GrowerConfidentialTierCard, {
  type GrowerConfidentialTierId,
} from '@/components/grower/GrowerConfidentialTierCard';
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
  const unlockEndpoint = useMemo(() => loc('/investor-deck/business-plans/unlock'), [loc]);

  const [shortPw, setShortPw] = useState('');
  const [mediumPw, setMediumPw] = useState('');
  const [longPw, setLongPw] = useState('');
  const [showShort, setShowShort] = useState(false);
  const [showMedium, setShowMedium] = useState(false);
  const [showLong, setShowLong] = useState(false);

  const [bootstrap, setBootstrap] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [tiersConfigured, setTiersConfigured] = useState<TierAvailability | null>(null);

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
    try {
      const res = await fetch(unlockEndpoint, {
        method: 'GET',
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 404) {
        setPageError(t('investorBusinessPlans.sectionDisabled'));
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

  const revokeTierSession = useCallback(async (tier: GrowerConfidentialTierId) => {
    try {
      await fetch(
        `${unlockEndpoint}?tier=${encodeURIComponent(tier)}`,
        {
          method: 'DELETE',
          cache: 'no-store',
          credentials: 'include',
        },
      );
    } catch {
      /* still collapse UI */
    }
    setUnlocked((prev) => ({ ...prev, [tier]: null }));
  }, [unlockEndpoint]);

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
        const res = await fetch(unlockEndpoint, {
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
    [loc, t, unlockEndpoint],
  );

  const tiers = useMemo(
    () =>
      [
        {
          id: 'short' as const,
          password: shortPw,
          setPassword: setShortPw,
          show: showShort,
          setShow: setShowShort,
        },
        {
          id: 'medium' as const,
          password: mediumPw,
          setPassword: setMediumPw,
          show: showMedium,
          setShow: setShowMedium,
        },
        {
          id: 'long' as const,
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
      unavailableLabel: '',
      passwordLabel: t('investorBusinessPlans.passwordAriaLabel'),
      passwordPlaceholder: '',
      unlockLabel: t('investorBusinessPlans.submitAriaLabel'),
      unlockingLabel: t('investorBusinessPlans.submitAriaLabel'),
      wrongPasswordLabel: t('grower.confidential.wrongPassword'),
      openPresentationLabel: t('grower.confidential.openPresentation'),
      openExternalLinkLabel: t('grower.confidential.openExternalLink'),
      refreshClearsLabel: '',
      lockAgainLabel: t('grower.confidential.lockAgain'),
      showPasswordLabel: t('grower.confidential.showPassword'),
      hidePasswordLabel: t('grower.confidential.hidePassword'),
    }),
    [t],
  );

  return (
    <div className="min-h-screen bg-white">
      {pageError ? (
        <p className="sr-only" role="alert">
          {pageError}
        </p>
      ) : null}

      <div
        className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-4 py-12"
        aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
      >
        {bootstrap === 'loading' || bootstrap === 'idle'
          ? [0, 1, 2].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-100" aria-hidden />
            ))
          : bootstrap === 'ok'
              ? tiers.map(({ id, password, setPassword, show, setShow }) => {
                const secretsOk = tiersConfigured?.[id] ?? false;
                const u = unlocked[id];
                const busy = loadingTier === id;

                return (
                  <GrowerConfidentialTierCard
                    key={id}
                    tierId={id}
                    title=""
                    hint=""
                    tierSecretsConfigured={secretsOk}
                    tenureBlocked={false}
                    unlockPresentationHref={u?.internalPath ?? null}
                    unlockExternalHref={u?.externalUrl ?? null}
                    password={password}
                    passwordOnly
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
    </div>
  );
}
