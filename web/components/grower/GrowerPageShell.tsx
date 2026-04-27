'use client';

import type { ReactNode } from 'react';

/** Shared grower area: matches Dashboard / My Batches / Steps — gray canvas + centered max width. */
export function GrowerPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${className ?? ''}`.trim()}
      >
        {children}
      </div>
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
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-gray-600">{description}</p>
        )}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
