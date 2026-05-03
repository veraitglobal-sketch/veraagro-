'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import GrowerConfidentialTierCard, {
  type GrowerConfidentialTierId,
} from '@/components/grower/GrowerConfidentialTierCard';
import { Shield } from 'lucide-react';

const SESSION_GATE_KEY = 'grower_confidential_access_token';

type TierAvailability = Record<GrowerConfidentialTierId, boolean>;

type TierUnlock = {
  internalPath: string | null;
  externalUrl: string | null;
};

function authHeaders(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('token');
  if (!token) return null;
  const gateTok = sessionStorage.getItem(SESSION_GATE_KEY)?.trim();
  return {
    Authorization: `Bearer ${token}`,
    ...(gateTok ? { 'X-Grower-Confidential-Access': gateTok } : {}),
  };
}

function internalPlanPath(tier: GrowerConfidentialTierId): string {
  return `/grower/confidential/plan/${tier}`;
}

const PRODUCER_LOGIN_CONFIDENTIAL = `/login/producer?returnTo=${encodeURIComponent('/grower/confidential')}`;

export default function GrowerConfidentialPage() {
  const { t } = useTranslation();
  const navItems = useGrowerNavItems();

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
  const [partnerPlanTenure, setPartnerPlanTenure] = useState<{
    medium: { eligible: boolean; minYears: number };
    long: { eligible: boolean; minYears: number };
  } | null>(null);
  const [inviteGateActive, setInviteGateActive] = useState(false);

  const [unlocked, setUnlocked] = useState<Record<GrowerConfidentialTierId, TierUnlock | null>>({
    short: null,
    medium: null,
    long: null,
  });
  const [loadingTier, setLoadingTier] = useState<GrowerConfidentialTierId | null>(null);
  const [errorTier, setErrorTier] = useState<GrowerConfidentialTierId | null>(null);
  const [tenureRejectedTier, setTenureRejectedTier] = useState<GrowerConfidentialTierId | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const q = params.get('access');
    if (!q?.trim()) return;
    sessionStorage.setItem(SESSION_GATE_KEY, q.trim());
    params.delete('access');
    const qs = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
  }, []);

  const loadBootstrap = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) {
      setPageError(t('grower.confidential.errorAuth'));
      setBootstrapErrorRecoverable(true);
      setBootstrap('error');
      return;
    }
    setBootstrap('loading');
    setPageError(null);
    setBootstrapErrorRecoverable(false);
    try {
      const res = await fetch('/api/grower/confidential-materials', {
        method: 'GET',
        headers,
        cache: 'no-store',
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

      if (res.status === 404) {
        setPageError(t('grower.confidential.sectionDisabled'));
        setBootstrapErrorRecoverable(false);
        setBootstrap('error');
        return;
      }
      if (res.status === 401) {
        setPageError(t('grower.confidential.errorAuth'));
        setBootstrapErrorRecoverable(true);
        setBootstrap('error');
        return;
      }
      if (res.status === 403) {
        setPageError(t('grower.confidential.errorGate'));
        setBootstrapErrorRecoverable(true);
        setBootstrap('error');
        return;
      }

      const tiers = data.tiersAvailable as TierAvailability | undefined;
      const configured = data.tiersConfigured as TierAvailability | undefined;
      const tenure = data.partnerPlanTenure as
        | {
            medium: { eligible: boolean; minYears: number };
            long: { eligible: boolean; minYears: number };
          }
        | undefined;
      const invite = Boolean(data.inviteGateActive);
      if (
        data.ok === true &&
        tiers &&
        configured &&
        tenure &&
        typeof tenure.medium?.eligible === 'boolean' &&
        typeof tenure.medium?.minYears === 'number' &&
        typeof tenure.long?.eligible === 'boolean' &&
        typeof tenure.long?.minYears === 'number' &&
        typeof tiers.short === 'boolean' &&
        typeof tiers.medium === 'boolean' &&
        typeof tiers.long === 'boolean' &&
        typeof configured.short === 'boolean' &&
        typeof configured.medium === 'boolean' &&
        typeof configured.long === 'boolean'
      ) {
        setTiersConfigured(configured);
        setTiersAvailable(tiers);
        setPartnerPlanTenure(tenure);
        setInviteGateActive(invite);
        setBootstrap('ok');
      } else {
        setPageError(t('grower.confidential.errorNetwork'));
        setBootstrapErrorRecoverable(true);
        setBootstrap('error');
      }
    } catch {
      setPageError(t('grower.confidential.errorNetwork'));
      setBootstrapErrorRecoverable(true);
      setBootstrap('error');
    }
  }, [t]);

  useEffect(() => {
    loadBootstrap();
  }, [loadBootstrap]);

  const revokeTierSession = useCallback(
    async (tier: GrowerConfidentialTierId) => {
      const headers = authHeaders();
      if (!headers) return;
      try {
        await fetch(`/api/grower/confidential-materials?tier=${encodeURIComponent(tier)}`, {
          method: 'DELETE',
          headers,
          cache: 'no-store',
          credentials: 'include',
        });
      } catch {
        /* still collapse UI */
      }
      setUnlocked((prev) => ({ ...prev, [tier]: null }));
    },
    [],
  );

  const fetchUnlock = useCallback(
    async (tier: GrowerConfidentialTierId, password: string) => {
      const headers = authHeaders();
      if (!headers) {
        setPageError(t('grower.confidential.errorAuth'));
        return;
      }
      setLoadingTier(tier);
      setErrorTier(null);
      setTenureRejectedTier(null);
      setPageError(null);
      try {
        const body = {
          passwords: {
            ...(tier === 'short' ? { short: password } : {}),
            ...(tier === 'medium' ? { medium: password } : {}),
            ...(tier === 'long' ? { long: password } : {}),
          },
        };
        const res = await fetch('/api/grower/confidential-materials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          body: JSON.stringify(body),
          cache: 'no-store',
          credentials: 'include',
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;

        if (res.status === 404) {
          setPageError(t('grower.confidential.sectionDisabled'));
          return;
        }
        if (res.status === 401) {
          setPageError(t('grower.confidential.errorAuth'));
          return;
        }
        if (res.status === 403) {
          setPageError(t('grower.confidential.errorGate'));
          return;
        }

        const rejected = data.tenureRejected as GrowerConfidentialTierId[] | undefined;
        if (Array.isArray(rejected) && rejected.includes(tier)) {
          setTenureRejectedTier(tier);
          setErrorTier(null);
          return;
        }
        setTenureRejectedTier(null);

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
            internalPath: internal ? internalPlanPath(tier) : null,
            externalUrl,
          },
        }));
        if (tier === 'short') setShortPw('');
        if (tier === 'medium') setMediumPw('');
        if (tier === 'long') setLongPw('');
      } catch {
        setPageError(t('grower.confidential.errorNetwork'));
      } finally {
        setLoadingTier(null);
      }
    },
    [t],
  );

  const tiers = useMemo(
    () =>
      [
        {
          id: 'short' as const,
          titleKey: 'grower.confidential.shortTitle',
          hintKey: 'grower.confidential.shortHint',
          password: shortPw,
          setPassword: setShortPw,
          show: showShort,
          setShow: setShowShort,
        },
        {
          id: 'medium' as const,
          titleKey: 'grower.confidential.mediumTitle',
          hintKey: 'grower.confidential.mediumHint',
          password: mediumPw,
          setPassword: setMediumPw,
          show: showMedium,
          setShow: setShowMedium,
        },
        {
          id: 'long' as const,
          titleKey: 'grower.confidential.longTitle',
          hintKey: 'grower.confidential.longHint',
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
      unavailableLabel: t('grower.confidential.tierUnavailable'),
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
    <AuthGuard requiredRoles={['GROWER', 'FARMER']} redirectTo={PRODUCER_LOGIN_CONFIDENTIAL}>
      <SidebarLayout title={t('grower.nav.confidential')} navItems={navItems}>
        <GrowerPageShell>
          <GrowerPageHeader
            title={t('grower.confidential.pageTitle')}
            description={t('grower.confidential.pageDescription', {
              mediumYears: partnerPlanTenure?.medium.minYears ?? 3,
              longYears: partnerPlanTenure?.long.minYears ?? 6,
            })}
          />

          <div className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50/90 p-4 sm:p-5">
            <div className="hidden shrink-0 sm:flex sm:h-12 sm:w-12 sm:items-center sm:justify-center sm:rounded-lg sm:bg-amber-100/80">
              <Shield className="h-7 w-7 text-amber-900/70" strokeWidth={1.75} aria-hidden />
            </div>
            <p className="text-base leading-relaxed text-amber-950">{t('grower.confidential.ndWarning')}</p>
          </div>

          {inviteGateActive && bootstrap === 'ok' ? (
            <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-base leading-relaxed text-gray-800 shadow-sm sm:p-5">
              {t('grower.confidential.inviteGateSessionHint')}
            </div>
          ) : null}

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
                  {t('grower.confidential.retry')}
                </button>
              ) : null}
            </div>
          ) : null}

          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-3"
            aria-busy={bootstrap === 'loading' || bootstrap === 'idle'}
            aria-label={
              bootstrap === 'loading' || bootstrap === 'idle'
                ? t('grower.confidential.loadingSkeleton')
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
                    const mediumMin = partnerPlanTenure?.medium.minYears ?? 3;
                    const longMin = partnerPlanTenure?.long.minYears ?? 6;
                    const tenureBlocked =
                      id === 'medium' &&
                      secretsOk &&
                      !unlockAllowed &&
                      partnerPlanTenure !== null &&
                      partnerPlanTenure.medium.minYears > 0 &&
                      !partnerPlanTenure.medium.eligible;
                    const tenureBlockedLong =
                      id === 'long' &&
                      secretsOk &&
                      !unlockAllowed &&
                      partnerPlanTenure !== null &&
                      partnerPlanTenure.long.minYears > 0 &&
                      !partnerPlanTenure.long.eligible;
                    const showTenureLock = tenureBlocked || tenureBlockedLong;
                    const u = unlocked[id];
                    const busy = loadingTier === id;

                    return (
                      <GrowerConfidentialTierCard
                        key={id}
                        tierId={id}
                        title={t(titleKey)}
                        hint={
                          id === 'short'
                            ? t(hintKey)
                            : id === 'medium'
                              ? t(hintKey, { years: mediumMin })
                              : t(hintKey, { years: longMin })
                        }
                        tierSecretsConfigured={secretsOk}
                        tenureBlocked={showTenureLock}
                        tenureBlockedMessage={
                          showTenureLock
                            ? tenureBlockedLong
                              ? t('grower.confidential.tierTenureBlockedLong', { years: longMin })
                              : t('grower.confidential.tierTenureBlockedMedium', { years: mediumMin })
                            : undefined
                        }
                        unlockPresentationHref={u?.internalPath ?? null}
                        unlockExternalHref={u?.externalUrl ?? null}
                        password={password}
                        onPasswordChange={(v) => {
                          setPassword(v);
                          if (errorTier === id) setErrorTier(null);
                          if (tenureRejectedTier === id) setTenureRejectedTier(null);
                        }}
                        showPassword={show}
                        onToggleShowPassword={() => setShow((s) => !s)}
                        wrongPassword={errorTier === id}
                        tenureNotice={
                          tenureRejectedTier === id
                            ? id === 'long'
                              ? t('grower.confidential.tenureRejectedNoticeLong', {
                                  years: partnerPlanTenure?.long.minYears ?? longMin,
                                })
                              : t('grower.confidential.tenureRejectedNoticeMedium', {
                                  years: partnerPlanTenure?.medium.minYears ?? mediumMin,
                                })
                            : null
                        }
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
              {t('grower.confidential.footerNote')}
            </p>
          ) : null}
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
