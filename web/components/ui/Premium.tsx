'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import {
  premiumAccentPanel,
  premiumBtnPrimary,
  premiumBtnSecondary,
  premiumCard,
  premiumCardHover,
  premiumEyebrow,
} from '@/lib/premium-classes';

function join(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(' ');
}

export function PremiumCard({
  children,
  className,
  hover,
  padding = 'p-5 sm:p-6',
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: string;
}) {
  return (
    <div className={join(premiumCard, hover && premiumCardHover, padding, className)}>
      {children}
    </div>
  );
}

export function PremiumAccentPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={join(premiumAccentPanel, className)}>{children}</div>;
}

export function PremiumEyebrow({ children }: { children: ReactNode }) {
  return <p className={premiumEyebrow}>{children}</p>;
}

export function PremiumStatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <PremiumCard hover>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-gray-600">{label}</h3>
        {icon ? <span className="text-[#2D5A27]/80">{icon}</span> : null}
      </div>
      <p className="mt-3 text-3xl font-light tracking-tight text-gray-900 tabular-nums">{value}</p>
    </PremiumCard>
  );
}

export function PremiumButton({
  children,
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary';
}) {
  const base = variant === 'primary' ? premiumBtnPrimary : premiumBtnSecondary;
  return (
    <button type="button" className={join(base, className)} {...props}>
      {children}
    </button>
  );
}

export function PremiumButtonLink({
  href,
  children,
  className,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary';
}) {
  const base = variant === 'primary' ? premiumBtnPrimary : premiumBtnSecondary;
  return (
    <Link href={href} className={join(base, className)}>
      {children}
    </Link>
  );
}

export function PremiumPageTitle({
  title,
  description,
  eyebrow,
  right,
}: {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <PremiumEyebrow>{eyebrow}</PremiumEyebrow> : null}
        <h1
          className={`text-3xl font-light tracking-tight text-gray-900 ${eyebrow ? 'mt-2' : ''}`}
        >
          {title}
        </h1>
        {description != null && description !== '' && (
          <p className="mt-2 max-w-3xl text-base leading-relaxed text-gray-600">{description}</p>
        )}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
