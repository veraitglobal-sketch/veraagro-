'use client';

import type { ReactNode } from 'react';

/**
 * Shared grower main area — same shell as the original My Batches page:
 * full width of the content column, `p-6`, gray-50 (not a narrow “boxed” max width).
 */
export function GrowerPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`w-full p-6 ${className ?? ''}`.trim()}>{children}</div>
    </div>
  );
}

export function GrowerPageHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-light tracking-tight text-gray-900">{title}</h1>
        {description != null && description !== '' && (
          <p className="mt-1 max-w-3xl text-base leading-relaxed text-gray-700">{description}</p>
        )}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
