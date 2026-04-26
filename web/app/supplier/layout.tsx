import type { ReactNode } from 'react';
import SupplierHeader from './SupplierHeader';

/**
 * B2B material supplier: incoming grower orders + message threads. Created by admin, not public signup.
 */
export default function SupplierLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50/80">
      <SupplierHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
