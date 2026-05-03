'use client';

import Link from 'next/link';
import { CalendarClock, Eye, EyeOff, ExternalLink, FileText, Lock } from 'lucide-react';
import type { FormEvent } from 'react';

export type GrowerConfidentialTierId = 'short' | 'medium' | 'long';

export type GrowerConfidentialTierCardProps = {
  tierId: GrowerConfidentialTierId;
  title: string;
  hint: string;
  /** Password + content published in env (tenure may still block medium/long). */
  tierSecretsConfigured: boolean;
  /** False for medium/long until account age meets minimum full years. */
  tenureBlocked?: boolean;
  tenureBlockedMessage?: string;
  /** After unlock: in-app reader path (may coexist with external URL). */
  unlockPresentationHref: string | null;
  unlockExternalHref: string | null;
  password: string;
  onPasswordChange: (value: string) => void;
  showPassword: boolean;
  onToggleShowPassword: () => void;
  wrongPassword: boolean;
  loading: boolean;
  onUnlock: () => void;
  onLockAgain: () => void | Promise<void>;
  unavailableLabel: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  unlockLabel: string;
  unlockingLabel: string;
  wrongPasswordLabel: string;
  openPresentationLabel: string;
  openExternalLinkLabel: string;
  refreshClearsLabel: string;
  lockAgainLabel: string;
  showPasswordLabel: string;
  hidePasswordLabel: string;
  /** Password matched but medium/long blocked by tenure (POST `tenureRejected`). */
  tenureNotice?: string | null;
};

export default function GrowerConfidentialTierCard(props: GrowerConfidentialTierCardProps) {
  const {
    tierId,
    title,
    hint,
    tierSecretsConfigured,
    tenureBlocked,
    tenureBlockedMessage,
    unlockPresentationHref,
    unlockExternalHref,
    password,
    onPasswordChange,
    showPassword,
    onToggleShowPassword,
    wrongPassword,
    loading,
    onUnlock,
    onLockAgain,
    unavailableLabel,
    passwordLabel,
    passwordPlaceholder,
    unlockLabel,
    unlockingLabel,
    wrongPasswordLabel,
    openPresentationLabel,
    openExternalLinkLabel,
    refreshClearsLabel,
    lockAgainLabel,
    showPasswordLabel,
    hidePasswordLabel,
    tenureNotice,
  } = props;

  const inputId = `grower-confidential-pw-${tierId}`;
  const errorId = `grower-confidential-err-${tierId}`;
  const hintId = `grower-confidential-hint-${tierId}`;

  const unlocked = unlockPresentationHref || unlockExternalHref;

  if (!tierSecretsConfigured) {
    return (
      <section
        aria-labelledby={`grower-confidential-title-${tierId}`}
        className="flex flex-col gap-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white">
            <Lock className="h-6 w-6 text-gray-400" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id={`grower-confidential-title-${tierId}`}
              className="text-lg font-semibold leading-snug text-gray-900"
            >
              {title}
            </h2>
            <p className="mt-1 text-base font-light leading-relaxed text-gray-600">{hint}</p>
            <p className="mt-4 text-base leading-relaxed text-gray-600">{unavailableLabel}</p>
          </div>
        </div>
      </section>
    );
  }

  if (tenureBlocked && tenureBlockedMessage) {
    return (
      <section
        aria-labelledby={`grower-confidential-title-${tierId}`}
        className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50/90 p-5 shadow-sm sm:p-6"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white">
            <CalendarClock className="h-6 w-6 text-amber-900/70" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="min-w-0">
            <h2
              id={`grower-confidential-title-${tierId}`}
              className="text-lg font-semibold leading-snug text-gray-900"
            >
              {title}
            </h2>
            <p id={hintId} className="mt-1 text-base font-light leading-relaxed text-gray-800">
              {hint}
            </p>
            <p className="mt-4 text-base leading-relaxed text-amber-950">{tenureBlockedMessage}</p>
          </div>
        </div>
      </section>
    );
  }

  const btnPrimary =
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2';
  const btnOutline =
    'inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2';

  return (
    <section
      aria-labelledby={`grower-confidential-title-${tierId}`}
      className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-gray-100 bg-[#2D5A27]/10">
          <Lock className="h-6 w-6 text-[#2D5A27]" strokeWidth={1.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2
            id={`grower-confidential-title-${tierId}`}
            className="text-lg font-semibold leading-snug text-gray-900"
          >
            {title}
          </h2>
          <p id={hintId} className="mt-1 text-base font-light leading-relaxed text-gray-700">
            {hint}
          </p>
        </div>
      </div>

      {unlocked ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {unlockPresentationHref ? (
              <Link href={unlockPresentationHref} className={btnPrimary}>
                <FileText className="h-5 w-5 shrink-0" aria-hidden />
                {openPresentationLabel}
              </Link>
            ) : null}
            {unlockExternalHref ? (
              <a
                href={unlockExternalHref}
                target="_blank"
                rel="noopener noreferrer"
                className={unlockPresentationHref ? btnOutline : btnPrimary}
              >
                <ExternalLink className="h-5 w-5 shrink-0" aria-hidden />
                {openExternalLinkLabel}
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <button
              type="button"
              onClick={() => void onLockAgain()}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base font-medium text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2"
            >
              {lockAgainLabel}
            </button>
            <p className="text-sm leading-relaxed text-gray-600">{refreshClearsLabel}</p>
          </div>
        </div>
      ) : (
        <form
          className="flex flex-col gap-3"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            onUnlock();
          }}
          noValidate
        >
          <div className="flex flex-col gap-2">
            <label htmlFor={inputId} className="text-base font-medium text-gray-900">
              {passwordLabel}
            </label>
            <div className="flex gap-2">
              <input
                id={inputId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder={passwordPlaceholder}
                aria-invalid={wrongPassword}
                aria-describedby={
                  [hintId, wrongPassword ? errorId : undefined].filter(Boolean).join(' ') || undefined
                }
                disabled={loading}
                className="min-h-[48px] flex-1 rounded-lg border border-gray-300 px-4 py-3 text-base focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25 disabled:bg-gray-50 disabled:text-gray-500"
              />
              <button
                type="button"
                onClick={onToggleShowPassword}
                disabled={loading}
                aria-label={showPassword ? hidePasswordLabel : showPasswordLabel}
                aria-pressed={showPassword}
                className="inline-flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/40 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </div>
          {wrongPassword ? (
            <p id={errorId} className="text-sm leading-relaxed text-red-700" role="alert">
              {wrongPasswordLabel}
            </p>
          ) : null}
          {tenureNotice ? (
            <p className="text-sm leading-relaxed text-amber-900" role="status">
              {tenureNotice}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading || !password.trim()}
            aria-busy={loading}
            className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-[#2D5A27] px-5 py-3 text-base font-medium text-white transition-colors hover:bg-[#23471f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? unlockingLabel : unlockLabel}
          </button>
        </form>
      )}
    </section>
  );
}
