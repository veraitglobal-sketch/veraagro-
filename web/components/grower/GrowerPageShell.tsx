'use client';

import type { ReactNode } from 'react';
import { PremiumPageTitle } from '@/components/ui/Premium';

/**
 * Shared grower main area — premium warm surface, full content column width.
 */
export function GrowerPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="premium-page-bg -m-4 md:-mx-8 md:-my-6 md:min-h-[calc(100vh-4rem)]">
      <div className={`w-full p-4 md:p-6 ${className ?? ''}`.trim()}>{children}</div>
    </div>
  );
}

export function GrowerPageHeader({
  title,
  description,
  right,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  right?: ReactNode;
  /** Optional small label above title (e.g. "Bio Vera") */
  eyebrow?: string;
}) {
  return (
    <PremiumPageTitle
      title={title}
      description={description}
      eyebrow={eyebrow}
      right={right}
    />
  );
}
