import type { Metadata } from 'next';
import { generatePageMetadata } from '@/app/metadata';

export const metadata: Metadata = generatePageMetadata(
  'Protocol 360 – Quality, Traceability & Compliance | Bio Vera',
  'Protocol 360: three-level quality control—field audit, biometric packaging verification, cold chain monitoring. EU compliance and digital passport for retail and producers.',
  '/protocol-360',
);

export default function Protocol360Layout({
  children,
}: { children: React.ReactNode }) {
  return <>{children}</>;
}
