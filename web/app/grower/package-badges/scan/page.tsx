'use client';

import { useState } from 'react';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import {
  packageBadgesAPI,
  type PackageBadgeScanResult,
  type PackageBadgePublicResolve,
} from '@/lib/api';
import { growerNavItems } from '@/lib/grower-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { en } from '@/lib/messages';
import { ExternalLink, Loader2, Package, Boxes } from 'lucide-react';

const copy = en.grower.packageBadges;

function errMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: unknown } } };
  const m = e.response?.data?.message;
  if (Array.isArray(m)) return m.join(' ') || fallback;
  if (typeof m === 'string' && m.trim()) return m;
  return fallback;
}

export default function GrowerPackageBadgesScanPage() {
  const [serial, setSerial] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tree, setTree] = useState<PackageBadgeScanResult | null>(null);
  const [publicInfo, setPublicInfo] = useState<PackageBadgePublicResolve | null>(null);

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const s = serial.trim();
    if (!s) {
      setError('Enter a serial');
      return;
    }
    setError(null);
    setTree(null);
    setPublicInfo(null);
    setLoading(true);
    try {
      const [scan, pub] = await Promise.allSettled([packageBadgesAPI.scan(s), packageBadgesAPI.publicResolve(s)]);
      if (scan.status === 'rejected') {
        throw scan.reason;
      }
      setTree(scan.value);
      if (pub.status === 'fulfilled') {
        setPublicInfo(pub.value);
      }
    } catch (err) {
      setError(errMessage(err, copy.scanErrGeneric));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard
      requiredRoles={['GROWER', 'FARMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN']}
      redirectTo="/login/producer"
    >
      <SidebarLayout title={copy.scanPageTitle} navItems={growerNavItems}>
        <GrowerPageShell className="space-y-6">
          <GrowerPageHeader
            title={copy.scanPageTitle}
            description={copy.scanPageDescription}
            right={
              <Link
                href="/grower/package-badges"
                className="text-sm font-medium text-[#2D5A27] hover:text-[#23471f] whitespace-nowrap"
              >
                {copy.scanBackRegister}
              </Link>
            }
          />

          <form
            onSubmit={onLookup}
            className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm max-w-xl space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{copy.scanSerialLabel}</label>
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-[#2D5A27] focus:border-transparent"
                placeholder={copy.scanSerialPlaceholder}
                autoComplete="off"
              />
            </div>
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2D5A27] px-4 py-2.5 text-white font-medium hover:bg-[#23471f] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? copy.scanSubmitting : copy.scanSubmit}
            </button>
          </form>

          {tree && (
            <div className="space-y-4 max-w-3xl">
              {tree.parent.lifecycle === 'RETURNED_TO_SUPPLIER' && (
                <p className="text-sm text-amber-900 bg-amber-100 border border-amber-300 rounded-lg px-3 py-2">
                  {copy.scanReturnedWarning}
                </p>
              )}
              {tree.isChild && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {copy.scanChildBadge}
                </p>
              )}

              <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {copy.scanScannedAs}
                </h3>
                <p className="font-mono text-lg text-gray-900 mb-4">{tree.scannedSerial}</p>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {copy.scanMasterBadge}
                </h3>
                <div className="rounded-md bg-gray-50 border border-gray-100 p-3 font-mono text-sm">
                  <div>
                    <span className="text-gray-500">Serial:</span> {tree.parent.serial}
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span> {tree.parent.type}
                  </div>
                  {tree.parent.lifecycle ? (
                    <div>
                      <span className="text-gray-500">{copy.scanLifecycle}:</span> {tree.parent.lifecycle}
                    </div>
                  ) : null}
                  {tree.parent.farmerQrCode ? (
                    <div>
                      <span className="text-gray-500">Farmer QR:</span> {tree.parent.farmerQrCode}
                    </div>
                  ) : null}
                  {tree.parent.batchId ? (
                    <div className="text-xs text-gray-400 mt-1">
                      {copy.scanInternalBatchId}: {tree.parent.batchId}
                    </div>
                  ) : null}
                </div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-5 mb-2 flex items-center gap-2">
                  <Boxes className="h-4 w-4" />
                  {copy.scanChildrenHeading}
                </h3>
                {tree.children.length === 0 ? (
                  <p className="text-sm text-gray-600">{copy.scanNoChildren}</p>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-200 rounded-md overflow-hidden">
                    {tree.children.map((c) => (
                      <li
                        key={c.serial}
                        className="px-3 py-2 text-sm font-mono bg-white flex flex-wrap justify-between items-center gap-2"
                      >
                        <span>{c.serial}</span>
                        <span className="text-gray-500 text-xs text-right">
                          {c.type}
                          {c.lifecycle ? ` · ${c.lifecycle}` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {publicInfo && (
                <div className="rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-5">
                  <h3 className="text-sm font-semibold text-[#23471f] mb-3">{copy.scanPublicLinks}</h3>
                  {publicInfo.hint ? <p className="text-xs text-gray-600 mb-3">{publicInfo.hint}</p> : null}
                  <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
                    {publicInfo.farmerProfileUrl ? (
                      <a
                        href={publicInfo.farmerProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D5A27] hover:underline"
                      >
                        {copy.scanFarmerLink}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : null}
                    {publicInfo.passportUrl ? (
                      <a
                        href={publicInfo.passportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#2D5A27] hover:underline"
                      >
                        {copy.scanPassportLink}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-600">{copy.scanNoPassport}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <p className="text-sm text-gray-600">
            {copy.scanToRegister}{' '}
            <Link href="/grower/package-badges" className="font-medium text-[#2D5A27] hover:underline">
              {en.grower.nav.packageBadges}
            </Link>
            .
          </p>
        </GrowerPageShell>
      </SidebarLayout>
    </AuthGuard>
  );
}
