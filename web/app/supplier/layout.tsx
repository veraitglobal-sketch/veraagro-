import type { ReactNode } from 'react';
import SupplierHeader from './SupplierHeader';

/**
 * B2B material supplier: incoming grower orders + message threads. Created by admin, not public signup.
 */
export default function SupplierLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100/90 to-stone-50/80">
      <SupplierHeader />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
