'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { PremiumButton, PremiumCard, PremiumPageTitle } from '@/components/ui/Premium';
import {
  b2bSuppliersAdminAPI,
  seedProductionAPI,
  usersAPI,
  type SeedBag,
  type SeedProductionRun,
  type SeedRunStatus,
} from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { useAdminNavItems } from '@/lib/admin-nav';
import { useTranslation } from 'react-i18next';
import { formatDateEn, formatDateTimeEn } from '@/lib/en-locale-dates';
import { ArrowLeft, Download, Loader2, X } from 'lucide-react';

const STEPS: SeedRunStatus[] = ['PLANNED', 'LABELS_ISSUED', 'PRODUCED', 'RELEASED'];
const PAGE_SIZE = 50;

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

function runStatusClass(status: string): string {
  if (status === 'RELEASED') return 'bg-green-100 text-green-800';
  if (status === 'PRODUCED') return 'bg-blue-100 text-blue-800';
  if (status === 'LABELS_ISSUED') return 'bg-amber-100 text-amber-800';
  if (status === 'RECALLED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function bagStatusClass(status: string): string {
  if (status === 'AVAILABLE' || status === 'ASSIGNED') return 'bg-green-100 text-green-800';
  if (status === 'PLANTED' || status === 'USED') return 'bg-blue-100 text-blue-800';
  if (status === 'RECALLED' || status === 'VOIDED') return 'bg-red-100 text-red-800';
  return 'bg-gray-100 text-gray-700';
}

function stepIndex(status: SeedRunStatus): number {
  if (status === 'RECALLED') return -1;
  const idx = STEPS.indexOf(status);
  return idx >= 0 ? idx : 0;
}

function parseSerialsInput(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SeedRunDetailPage() {
  const { t } = useTranslation();
  const adminNavItems = useAdminNavItems();
  const params = useParams();
  const runId = typeof params.id === 'string' ? params.id : '';

  const [run, setRun] = useState<SeedProductionRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bagPage, setBagPage] = useState(0);
  const [selectedBag, setSelectedBag] = useState<SeedBag | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [mapSuppliers, setMapSuppliers] = useState<Array<{ userId: string; businessName: string; partnerCode: string }>>([]);

  const [confirmForm, setConfirmForm] = useState({
    bagsProduced: '',
    productionDate: new Date().toISOString().slice(0, 10),
    germinationPct: '',
    purityPct: '',
    certificateUrls: '',
  });
  const [assignForm, setAssignForm] = useState({ growerId: '', growerLabel: '', serials: '' });
  const [assignPreview, setAssignPreview] = useState<Array<{ serial: string; ok: boolean; reason?: string }> | null>(null);
  const [growerQuery, setGrowerQuery] = useState('');
  const [growerOptions, setGrowerOptions] = useState<
    Array<{ id: string; firstName: string; lastName: string; partnerCode: string }>
  >([]);
  const [shipForm, setShipForm] = useState({ supplierUserId: '', serials: '' });
  const [shipResults, setShipResults] = useState<Array<{ serial: string; ok: boolean; reason?: string }> | null>(null);
  const [recallReason, setRecallReason] = useState('');
  const [recallPreview, setRecallPreview] = useState<Awaited<ReturnType<typeof seedProductionAPI.getRecallImpact>> | null>(null);
  const [recallPreviewLoading, setRecallPreviewLoading] = useState(false);
  const [affectedAfterRecall, setAffectedAfterRecall] = useState<
    Awaited<ReturnType<typeof seedProductionAPI.getRecallImpact>>['affectedParcels'] | null
  >(null);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [uploadedCertUrls, setUploadedCertUrls] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!runId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await seedProductionAPI.getRun(runId);
      setRun(data);
      if (data.bagsProduced) {
        setConfirmForm((f) => ({ ...f, bagsProduced: String(data.bagsProduced) }));
      } else if (data.bagsPlanned) {
        setConfirmForm((f) => ({ ...f, bagsProduced: String(data.bagsPlanned) }));
      }
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errLoad'));
      setRun(null);
    } finally {
      setLoading(false);
    }
  }, [runId, t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!recallOpen || !runId) return;
    setRecallPreviewLoading(true);
    void seedProductionAPI
      .getRecallImpact(runId)
      .then(setRecallPreview)
      .catch(() => setRecallPreview(null))
      .finally(() => setRecallPreviewLoading(false));
  }, [recallOpen, runId]);

  useEffect(() => {
    if (!assignOpen) return;
    const q = growerQuery.trim();
    if (q.length < 2) {
      setGrowerOptions([]);
      return;
    }
    const timer = setTimeout(() => {
      void usersAPI
        .getAll({ role: 'GROWER', search: q })
        .then((rows: Array<{ id: string; firstName: string; lastName: string; partnerCode: string }>) => {
          setGrowerOptions(Array.isArray(rows) ? rows.slice(0, 8) : []);
        })
        .catch(() => setGrowerOptions([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [assignOpen, growerQuery]);

  useEffect(() => {
    if (!assignOpen || !runId) return;
    const serials = parseSerialsInput(assignForm.serials);
    if (serials.length === 0) {
      setAssignPreview(null);
      return;
    }
    const timer = setTimeout(() => {
      void seedProductionAPI.previewAssignBags(runId, serials).then((res) => setAssignPreview(res.results));
    }, 300);
    return () => clearTimeout(timer);
  }, [assignOpen, assignForm.serials, runId]);

  useEffect(() => {
    if (!shipOpen) return;
    void b2bSuppliersAdminAPI.getNetworkOverview().then((data) => {
      setMapSuppliers(
        data.suppliers
          .filter((s) => s.mapApproved)
          .map((s) => ({
            userId: s.userId,
            businessName: s.businessName,
            partnerCode: s.user.partnerCode,
          })),
      );
    });
  }, [shipOpen]);

  const bags = run?.bags ?? [];
  const pagedBags = useMemo(() => {
    const start = bagPage * PAGE_SIZE;
    return bags.slice(start, start + PAGE_SIZE);
  }, [bags, bagPage]);
  const totalPages = Math.max(1, Math.ceil(bags.length / PAGE_SIZE));

  const currentStep = run ? stepIndex(run.status) : 0;
  const isRecalled = run?.status === 'RECALLED';

  const doIssueLabels = async () => {
    if (!run || !window.confirm(t('seedProduction.runDetail.issueLabelsConfirm', { count: run.bagsPlanned }))) return;
    setActionLoading('issue');
    setError(null);
    try {
      const updated = await seedProductionAPI.issueLabels(run.id);
      setRun(updated);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doDownloadCsv = async () => {
    if (!run) return;
    setActionLoading('csv');
    try {
      const blob = await seedProductionAPI.downloadLabelsCsv(run.id);
      downloadBlob(blob, `seed-labels-${run.lotNumber}.csv`);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doDownloadPdf = async (format: 'sheet' | 'roll') => {
    if (!run) return;
    setActionLoading(format);
    try {
      const blob = await seedProductionAPI.downloadLabelsPdf(run.id, format);
      downloadBlob(blob, `seed-labels-${run.lotNumber}-${format}.pdf`);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doConfirmProduction = async () => {
    if (!run) return;
    setActionLoading('confirm');
    setError(null);
    try {
      const manualUrls = confirmForm.certificateUrls
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean);
      const uploaded: string[] = [...uploadedCertUrls];
      for (const file of certificateFiles) {
        const { url } = await seedProductionAPI.uploadCertificate(file);
        uploaded.push(url);
      }
      const urls = [...uploaded, ...manualUrls];
      const updated = await seedProductionAPI.confirmProduction(run.id, {
        bagsProduced: Number(confirmForm.bagsProduced),
        productionDate: confirmForm.productionDate,
        germinationPct: confirmForm.germinationPct ? Number(confirmForm.germinationPct) : undefined,
        purityPct: confirmForm.purityPct ? Number(confirmForm.purityPct) : undefined,
        certificateUrls: urls.length > 0 ? urls : undefined,
      });
      setRun(updated);
      setConfirmOpen(false);
      setCertificateFiles([]);
      setUploadedCertUrls([]);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doRelease = async () => {
    if (!run || !window.confirm(t('seedProduction.runDetail.releaseConfirm'))) return;
    setActionLoading('release');
    setError(null);
    try {
      const updated = await seedProductionAPI.releaseRun(run.id);
      setRun(updated);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doRecall = async () => {
    if (!run || !recallReason.trim()) return;
    setActionLoading('recall');
    setError(null);
    try {
      const res = await seedProductionAPI.recallRun(run.id, recallReason.trim());
      setAffectedAfterRecall(recallPreview?.affectedParcels ?? null);
      setRecallOpen(false);
      setRecallReason('');
      setRecallPreview(null);
      if (res.affectedParcels?.length) {
        const grouped = new Map<string, { parcelId: string; serialNumbers: string[] }>();
        for (const row of res.affectedParcels) {
          const pid = row.plantedParcelId ?? '';
          if (!pid) continue;
          const g = grouped.get(pid) ?? { parcelId: pid, serialNumbers: [] };
          g.serialNumbers.push(row.serialNumber);
          grouped.set(pid, g);
        }
        setAffectedAfterRecall(
          [...grouped.values()].map((g) => ({
            parcelId: g.parcelId,
            serialNumbers: g.serialNumbers,
            plantedAt: null,
            cropType: null,
            estateName: null,
            areaM2: null,
          })),
        );
      }
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doAssign = async () => {
    if (!run) return;
    const serials = parseSerialsInput(assignForm.serials);
    if (serials.length === 0 || !assignForm.growerId.trim()) return;
    setActionLoading('assign');
    setError(null);
    try {
      await seedProductionAPI.assignBags(run.id, {
        growerId: assignForm.growerId.trim(),
        serials,
      });
      setAssignOpen(false);
      setAssignForm({ growerId: '', growerLabel: '', serials: '' });
      setAssignPreview(null);
      setGrowerQuery('');
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const doShip = async () => {
    if (!run) return;
    const serials = parseSerialsInput(shipForm.serials);
    if (serials.length === 0 || !shipForm.supplierUserId) return;
    setActionLoading('ship');
    setError(null);
    setShipResults(null);
    try {
      const res = await seedProductionAPI.shipBags(run.id, {
        supplierUserId: shipForm.supplierUserId,
        serials,
      });
      setShipResults(res.results);
      await load();
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'seedProduction.runDetail.errAction'));
    } finally {
      setActionLoading(null);
    }
  };

  const previewSerialCount = parseSerialsInput(assignForm.serials).length;
  const assignPreviewOk = assignPreview?.filter((r) => r.ok).length ?? 0;
  const previewShipSerialCount = parseSerialsInput(shipForm.serials).length;

  return (
    <AuthGuard requiredRoles={['SUPER_ADMIN', 'ADMIN']}>
      <SidebarLayout title={run?.lotNumber ?? t('seedProduction.title')} navItems={adminNavItems}>
        <div className="space-y-6">
          <div>
            <Link
              href="/admin/seed-production"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#2D5A27] hover:underline"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('seedProduction.runDetail.back')}
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('seedProduction.common.loading')}
            </div>
          ) : !run ? (
            <p className="text-sm text-gray-600">{t('seedProduction.runDetail.errLoad')}</p>
          ) : (
            <>
              <PremiumPageTitle
                title={`${run.lotNumber} · ${run.approvedProduct?.name ?? '—'}`}
                description={`${run.producer?.name ?? '—'} · ${t('seedProduction.runs.seedYear')} ${run.seedCropYear}`}
                right={
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${runStatusClass(run.status)}`}>
                    {t(`seedProduction.runStatus.${run.status}`)}
                  </span>
                }
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
              )}

              {/* Status stepper */}
              <PremiumCard padding="p-5 sm:p-6">
                <ol className="flex flex-wrap items-center gap-2 sm:gap-4">
                  {STEPS.map((step, idx) => {
                    const done = !isRecalled && idx <= currentStep;
                    const active = !isRecalled && idx === currentStep;
                    return (
                      <li key={step} className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                            done ? 'bg-[#2D5A27] text-white' : 'border border-gray-300 bg-white text-gray-500'
                          } ${active ? 'ring-2 ring-[#2D5A27] ring-offset-2' : ''}`}
                        >
                          {idx + 1}
                        </span>
                        <span className={`text-sm ${done ? 'font-medium text-gray-900' : 'text-gray-500'}`}>
                          {t(`seedProduction.runDetail.stepper.${step === 'PLANNED' ? 'planned' : step === 'LABELS_ISSUED' ? 'labelsIssued' : step === 'PRODUCED' ? 'produced' : 'released'}`)}
                        </span>
                        {idx < STEPS.length - 1 && <span className="hidden text-gray-300 sm:inline">→</span>}
                      </li>
                    );
                  })}
                  {isRecalled && (
                    <li className="ml-2 flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-medium text-white">!</span>
                      <span className="text-sm font-medium text-red-700">{t('seedProduction.runDetail.stepper.recalled')}</span>
                    </li>
                  )}
                </ol>
                {isRecalled && run.recallReason && (
                  <p className="mt-3 text-sm text-red-700">{run.recallReason}</p>
                )}
              </PremiumCard>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                {run.status === 'PLANNED' && (
                  <PremiumButton onClick={doIssueLabels} disabled={!!actionLoading}>
                    {actionLoading === 'issue' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.issueLabels')}
                  </PremiumButton>
                )}
                {['LABELS_ISSUED', 'PRODUCED', 'RELEASED', 'RECALLED'].includes(run.status) && (
                  <>
                    <PremiumButton variant="secondary" onClick={() => doDownloadPdf('sheet')} disabled={!!actionLoading}>
                      <Download className="mr-2 inline h-4 w-4" />
                      {t('seedProduction.runDetail.downloadPdfSheet')}
                    </PremiumButton>
                    <PremiumButton variant="secondary" onClick={() => doDownloadPdf('roll')} disabled={!!actionLoading}>
                      <Download className="mr-2 inline h-4 w-4" />
                      {t('seedProduction.runDetail.downloadPdfRoll')}
                    </PremiumButton>
                    <PremiumButton variant="secondary" onClick={doDownloadCsv} disabled={!!actionLoading}>
                      <Download className="mr-2 inline h-4 w-4" />
                      {t('seedProduction.runDetail.downloadCsv')}
                    </PremiumButton>
                  </>
                )}
                {run.status === 'LABELS_ISSUED' && (
                  <PremiumButton onClick={() => setConfirmOpen(true)} disabled={!!actionLoading}>
                    {t('seedProduction.runDetail.confirmProduction')}
                  </PremiumButton>
                )}
                {run.status === 'PRODUCED' && (
                  <PremiumButton onClick={doRelease} disabled={!!actionLoading}>
                    {actionLoading === 'release' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.release')}
                  </PremiumButton>
                )}
                {run.status === 'RELEASED' && (
                  <>
                    <PremiumButton onClick={() => setAssignOpen(true)} disabled={!!actionLoading}>
                      {t('seedProduction.runDetail.assignBags')}
                    </PremiumButton>
                    <PremiumButton variant="secondary" onClick={() => { setShipOpen(true); setShipResults(null); }} disabled={!!actionLoading}>
                      {t('seedProduction.runDetail.shipToSupplier', { defaultValue: 'Ship to supplier' })}
                    </PremiumButton>
                  </>
                )}
                {['PRODUCED', 'RELEASED'].includes(run.status) && (
                  <PremiumButton
                    variant="secondary"
                    className="!border-red-300 !text-red-700 hover:!bg-red-50"
                    onClick={() => setRecallOpen(true)}
                    disabled={!!actionLoading}
                  >
                    {t('seedProduction.runDetail.recall')}
                  </PremiumButton>
                )}
              </div>

              {/* Summary */}
              <PremiumCard>
                <h3 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.summary')}</h3>
                <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                  <div><dt className="text-gray-500">{t('seedProduction.runs.bagsPlanned')}</dt><dd className="font-medium">{run.bagsPlanned}</dd></div>
                  <div><dt className="text-gray-500">{t('seedProduction.runs.bagsProduced')}</dt><dd className="font-medium">{run.bagsProduced ?? '—'}</dd></div>
                  <div><dt className="text-gray-500">{t('seedProduction.newRunModal.bagSizeLabel')}</dt><dd className="font-medium">{run.bagSizeLabel}</dd></div>
                  <div><dt className="text-gray-500">{t('seedProduction.newRunModal.originCountry')}</dt><dd className="font-medium">{run.originCountry}{run.originRegion ? ` · ${run.originRegion}` : ''}</dd></div>
                  <div><dt className="text-gray-500">{t('seedProduction.runDetail.confirmModal.productionDate')}</dt><dd className="font-medium">{formatDateEn(run.productionDate)}</dd></div>
                  <div><dt className="text-gray-500">{t('seedProduction.runDetail.confirmModal.germinationPct')}</dt><dd className="font-medium">{run.germinationPct ?? '—'}</dd></div>
                </dl>
                {run.bagCounts && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(run.bagCounts).map(([status, count]) => (
                      <span key={status} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${bagStatusClass(status)}`}>
                        {t(`seedProduction.bagStatus.${status}`, status)}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </PremiumCard>

              {isRecalled && affectedAfterRecall && affectedAfterRecall.length > 0 && (
                <PremiumCard padding="p-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.affectedParcels')}</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {affectedAfterRecall.map((p) => (
                      <li key={p.parcelId} className="rounded-lg border border-gray-200 px-3 py-2">
                        <span className="font-mono text-xs text-gray-600">{p.parcelId}</span>
                        {p.estateName ? <span className="ml-2 text-gray-700">{p.estateName}</span> : null}
                        <p className="mt-1 text-gray-600">
                          {t('seedProduction.runDetail.affectedParcelsBags', { count: p.serialNumbers.length })}
                          {p.serialNumbers.length > 0 ? `: ${p.serialNumbers.join(', ')}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                </PremiumCard>
              )}

              {/* Bags table */}
              <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
                  <h3 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.bagsTable')}</h3>
                  {bags.length > PAGE_SIZE && (
                    <div className="flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        disabled={bagPage === 0}
                        onClick={() => setBagPage((p) => p - 1)}
                        className="rounded border px-2 py-1 disabled:opacity-40"
                      >
                        ←
                      </button>
                      <span>{bagPage + 1} / {totalPages}</span>
                      <button
                        type="button"
                        disabled={bagPage >= totalPages - 1}
                        onClick={() => setBagPage((p) => p + 1)}
                        className="rounded border px-2 py-1 disabled:opacity-40"
                      >
                        →
                      </button>
                    </div>
                  )}
                </div>
                {bags.length === 0 ? (
                  <p className="px-5 py-8 text-sm text-gray-600 sm:px-6">{t('seedProduction.runDetail.noBags')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runDetail.serial')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runDetail.bagNo')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runs.status')}</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">{t('seedProduction.runDetail.parcel')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pagedBags.map((bag) => (
                          <tr
                            key={bag.id}
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => setSelectedBag(bag)}
                          >
                            <td className="px-4 py-3 font-mono text-xs">{bag.serialNumber}</td>
                            <td className="px-4 py-3 tabular-nums">{bag.bagNumber ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bagStatusClass(bag.status)}`}>
                                {t(`seedProduction.bagStatus.${bag.status}`, bag.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">{bag.plantedParcelId ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Confirm production modal */}
        {confirmOpen && run && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.confirmModal.title')}</h2>
                <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.bagsProduced')}</span>
                  <input
                    type="number"
                    min={1}
                    max={run.bagsPlanned}
                    value={confirmForm.bagsProduced}
                    onChange={(e) => setConfirmForm((f) => ({ ...f, bagsProduced: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.productionDate')}</span>
                  <input
                    type="date"
                    value={confirmForm.productionDate}
                    onChange={(e) => setConfirmForm((f) => ({ ...f, productionDate: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.germinationPct')}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={confirmForm.germinationPct}
                      onChange={(e) => setConfirmForm((f) => ({ ...f, germinationPct: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.purityPct')}</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={confirmForm.purityPct}
                      onChange={(e) => setConfirmForm((f) => ({ ...f, purityPct: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.certificateUpload')}</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    multiple
                    onChange={(e) => setCertificateFiles(Array.from(e.target.files ?? []))}
                    className="mt-1 w-full text-sm text-gray-700"
                  />
                  {certificateFiles.length > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('seedProduction.runDetail.confirmModal.certificateFilesSelected', { count: certificateFiles.length })}
                    </p>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.confirmModal.certificateUrls')}</span>
                  <textarea
                    rows={3}
                    value={confirmForm.certificateUrls}
                    onChange={(e) => setConfirmForm((f) => ({ ...f, certificateUrls: e.target.value }))}
                    placeholder={t('seedProduction.runDetail.confirmModal.certificateUrlsHint')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setConfirmOpen(false)} disabled={!!actionLoading}>
                  {t('seedProduction.common.close')}
                </PremiumButton>
                <PremiumButton onClick={doConfirmProduction} disabled={!!actionLoading || !confirmForm.bagsProduced || !confirmForm.productionDate}>
                  {actionLoading === 'confirm' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.confirmModal.submit')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}

        {/* Assign modal */}
        {assignOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.assignModal.title')}</h2>
                <button type="button" onClick={() => setAssignOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.assignModal.growerSearch')}</span>
                  <input
                    value={assignForm.growerLabel || growerQuery}
                    onChange={(e) => {
                      setGrowerQuery(e.target.value);
                      setAssignForm((f) => ({ ...f, growerId: '', growerLabel: '' }));
                    }}
                    placeholder={t('seedProduction.runDetail.assignModal.growerSearchPlaceholder')}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                  {growerOptions.length > 0 && !assignForm.growerId && (
                    <ul className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white text-sm shadow-sm">
                      {growerOptions.map((g) => (
                        <li key={g.id}>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left hover:bg-gray-50"
                            onClick={() => {
                              setAssignForm((f) => ({
                                ...f,
                                growerId: g.id,
                                growerLabel: `${g.firstName} ${g.lastName} (${g.partnerCode})`,
                              }));
                              setGrowerQuery('');
                              setGrowerOptions([]);
                            }}
                          >
                            {g.firstName} {g.lastName}{' '}
                            <span className="font-mono text-xs text-gray-500">{g.partnerCode}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {assignForm.growerId && (
                    <p className="mt-1 text-sm text-[#2D5A27]">{assignForm.growerLabel}</p>
                  )}
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.assignModal.serials')}</span>
                  <textarea
                    rows={6}
                    value={assignForm.serials}
                    onChange={(e) => setAssignForm((f) => ({ ...f, serials: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('seedProduction.runDetail.assignModal.serialsHint')}</p>
                  {assignPreview && assignPreview.length > 0 && (
                    <ul className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-gray-200 text-sm divide-y">
                      {assignPreview.map((r) => (
                        <li key={r.serial} className={`px-3 py-1.5 font-mono text-xs ${r.ok ? 'text-green-800' : 'text-red-700'}`}>
                          {r.serial} {r.ok ? '✓' : `✗ ${r.reason ?? 'invalid'}`}
                        </li>
                      ))}
                    </ul>
                  )}
                  {previewSerialCount > 0 && assignPreview && (
                    <p className="mt-2 text-sm text-gray-700">
                      {t('seedProduction.runDetail.assignModal.preview')}:{' '}
                      {t('seedProduction.runDetail.assignModal.validCount', { count: assignPreviewOk })} / {previewSerialCount}
                    </p>
                  )}
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setAssignOpen(false)} disabled={!!actionLoading}>
                  {t('seedProduction.common.close')}
                </PremiumButton>
                <PremiumButton
                  onClick={doAssign}
                  disabled={!!actionLoading || !assignForm.growerId.trim() || previewSerialCount === 0 || assignPreviewOk === 0}
                >
                  {actionLoading === 'assign' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.assignModal.submit')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}

        {/* Ship to supplier modal */}
        {shipOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.shipModal.title', { defaultValue: 'Ship to supplier' })}</h2>
                <button type="button" onClick={() => setShipOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.shipModal.supplier', { defaultValue: 'Map-approved supplier' })}</span>
                  <select
                    value={shipForm.supplierUserId}
                    onChange={(e) => setShipForm((f) => ({ ...f, supplierUserId: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  >
                    <option value="">{t('seedProduction.runDetail.shipModal.selectSupplier', { defaultValue: 'Select supplier…' })}</option>
                    {mapSuppliers.map((s) => (
                      <option key={s.userId} value={s.userId}>
                        {s.businessName} ({s.partnerCode})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.assignModal.serials')}</span>
                  <textarea
                    rows={6}
                    value={shipForm.serials}
                    onChange={(e) => setShipForm((f) => ({ ...f, serials: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('seedProduction.runDetail.assignModal.serialsHint')}</p>
                  {previewShipSerialCount > 0 && (
                    <p className="mt-2 text-sm text-gray-700">
                      {t('seedProduction.runDetail.assignModal.preview')}: {previewShipSerialCount} serial(s)
                    </p>
                  )}
                </label>
                {shipResults && (
                  <ul className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 text-sm divide-y">
                    {shipResults.map((r) => (
                      <li key={r.serial} className={`px-3 py-2 ${r.ok ? 'text-green-800' : 'text-red-700'}`}>
                        <span className="font-mono text-xs">{r.serial}</span>
                        {r.ok ? ' ✓' : ` — ${r.reason ?? 'failed'}`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setShipOpen(false)} disabled={!!actionLoading}>
                  {t('seedProduction.common.close')}
                </PremiumButton>
                <PremiumButton
                  onClick={doShip}
                  disabled={!!actionLoading || !shipForm.supplierUserId || previewShipSerialCount === 0}
                >
                  {actionLoading === 'ship' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.shipModal.submit', { defaultValue: 'Ship bags' })}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}

        {/* Recall modal */}
        {recallOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-10" role="dialog" aria-modal="true">
            <div className="mb-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-medium text-gray-900">{t('seedProduction.runDetail.recallModal.title')}</h2>
                <button type="button" onClick={() => setRecallOpen(false)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 px-6 py-5">
                <p className="text-sm text-red-700">{t('seedProduction.runDetail.recallModal.warning')}</p>
                {recallPreviewLoading ? (
                  <p className="text-sm text-gray-600">{t('seedProduction.common.loading')}</p>
                ) : recallPreview ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm space-y-3">
                    <p className="font-medium text-amber-900">
                      {t('seedProduction.runDetail.recallModal.impact', { count: recallPreview.bagsToRecall })}
                    </p>
                    {Object.keys(recallPreview.byStatus).length > 0 && (
                      <ul className="flex flex-wrap gap-2">
                        {Object.entries(recallPreview.byStatus).map(([status, count]) => (
                          <li key={status} className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-800">
                            {t(`seedProduction.bagStatus.${status}`, status)}: {count}
                          </li>
                        ))}
                      </ul>
                    )}
                    {recallPreview.growers.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-800">{t('seedProduction.runDetail.recallModal.growers')}</p>
                        <ul className="mt-1 list-disc pl-5 text-gray-700">
                          {recallPreview.growers.map((g) => (
                            <li key={g.id}>
                              {g.firstName} {g.lastName} ({g.partnerCode})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recallPreview.affectedParcels.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-800">{t('seedProduction.runDetail.recallModal.parcels')}</p>
                        <ul className="mt-1 space-y-1 text-gray-700">
                          {recallPreview.affectedParcels.map((p) => (
                            <li key={p.parcelId}>
                              <span className="font-mono text-xs">{p.parcelId}</span>
                              {p.estateName ? ` · ${p.estateName}` : ''}
                              {' · '}
                              {p.serialNumbers.length} bag(s)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
                <label className="block">
                  <span className="text-sm font-medium text-gray-700">{t('seedProduction.runDetail.recallModal.reason')}</span>
                  <textarea
                    rows={4}
                    value={recallReason}
                    onChange={(e) => setRecallReason(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-gray-200 px-6 py-4">
                <PremiumButton variant="secondary" onClick={() => setRecallOpen(false)} disabled={!!actionLoading}>
                  {t('seedProduction.common.close')}
                </PremiumButton>
                <PremiumButton
                  className="!border-red-300 !bg-red-700 hover:!bg-red-800"
                  onClick={doRecall}
                  disabled={!!actionLoading || !recallReason.trim()}
                >
                  {actionLoading === 'recall' ? <Loader2 className="h-4 w-4 animate-spin" /> : t('seedProduction.runDetail.recallModal.submit')}
                </PremiumButton>
              </div>
            </div>
          </div>
        )}

        {/* Bag drawer */}
        {selectedBag && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" onClick={() => setSelectedBag(null)}>
            <div
              className="h-full w-full max-w-md overflow-y-auto bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <h2 className="font-mono text-sm">{selectedBag.serialNumber}</h2>
                <button type="button" onClick={() => setSelectedBag(null)} className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4 p-5">
                <p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${bagStatusClass(selectedBag.status)}`}>
                    {t(`seedProduction.bagStatus.${selectedBag.status}`, selectedBag.status)}
                  </span>
                </p>
                <Link
                  href={`/admin/seed-production/lookup?serial=${encodeURIComponent(selectedBag.serialNumber)}`}
                  className="text-sm font-medium text-[#2D5A27] hover:underline"
                >
                  {t('seedProduction.lookup.title')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </SidebarLayout>
    </AuthGuard>
  );
}
