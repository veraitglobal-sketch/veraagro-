import type { ReactNode } from 'react';
import SeedProducerHeader from './SeedProducerHeader';

export default function SeedProducerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <SeedProducerHeader />
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">{children}</div>
    </div>
  );
}
