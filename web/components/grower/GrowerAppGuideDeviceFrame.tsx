import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  /** Lighter chrome for PDF export / print */
  pdfExport?: boolean;
};

/**
 * Consistent device chrome for native iPhone screenshots (1170×2532).
 * Screenshots should be full-screen captures without an embedded mockup frame.
 */
export function GrowerAppGuideDeviceFrame({ children, pdfExport = false }: Props) {
  return (
    <div className="mx-auto w-full max-w-[min(100%,342px)]">
      <div
        className={
          pdfExport
            ? 'rounded-[2rem] border border-gray-300 bg-gray-900 p-2'
            : 'rounded-[2.5rem] bg-gray-900 p-2.5 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.28)] ring-1 ring-black/10'
        }
      >
        <div className="overflow-hidden rounded-[1.85rem] bg-white">{children}</div>
      </div>
    </div>
  );
}
