'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import { motion } from 'framer-motion';
import { useGrowerNavItems } from '@/lib/grower-nav';
import { batchesAPI } from '@/lib/api';
import { WEB_API_BASE } from '@/lib/api-base';
import Link from 'next/link';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';

const PHOTO_ORDER = ['PUNNETS', 'LABELING', 'PALLETIZATION'] as const;

type LabelRoll = {
  serialNumber: string;
  status: string;
  soldAt: string | null;
  productName: string;
};

type ComplianceStatus = {
  publicBatchId: string;
  complete: boolean;
  requiredPhotoTypes: string[];
  uploadedPhotoTypes: string[];
  missingPhotoTypes: string[];
  stickerRollId: string | null;
  stickerStatus: string | null;
  lastComplianceAt: string | null;
};

export default function CompliancePhotosPage() {
  const { t, i18n } = useTranslation();
  const navItems = useGrowerNavItems();

  const requiredPhotos = useMemo(
    () =>
      PHOTO_ORDER.map((type) => ({
        type,
        label: t(`grower.compliancePhotos.photoTypes.${type}.label`),
        description: t(`grower.compliancePhotos.photoTypes.${type}.description`),
      })),
    [t, i18n.language],
  );

  const explainerBullets = t('grower.compliancePhotos.explainerBullets', { returnObjects: true }) as string[];

  const messageFromApiPayload = (data: unknown): string => {
    if (!data || typeof data !== 'object') return t('common.requestFailed');
    const msg = (data as { message?: unknown }).message;
    if (Array.isArray(msg)) return msg.filter(Boolean).join(' ');
    if (typeof msg === 'string') return msg;
    return t('common.requestFailed');
  };
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [stickerRollId, setStickerRollId] = useState<string>('');
  const [photos, setPhotos] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [batches, setBatches] = useState<
    { id: string; batchId: string; productName: string; quantity: number; unit?: string }[]
  >([]);
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [labelRolls, setLabelRolls] = useState<LabelRoll[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showReplaceForm, setShowReplaceForm] = useState(false);

  const setFileInputRef = (index: number) => (el: HTMLInputElement | null) => {
    fileInputRefs.current[index] = el;
  };

  const pickableSerials = useMemo(() => {
    return new Set(
      labelRolls
        .filter(
          (r) =>
            r.status === 'SOLD' ||
            (r.status === 'USED' && r.serialNumber === complianceStatus?.stickerRollId)
        )
        .map((r) => r.serialNumber)
    );
  }, [labelRolls, complianceStatus?.stickerRollId]);

  const fetchComplianceStatus = useCallback(async (batchInternalId: string) => {
    setStatusLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${WEB_API_BASE}/material-control/compliance-status/${batchInternalId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setComplianceStatus(null);
        return;
      }
      const data = (await res.json()) as ComplianceStatus;
      setComplianceStatus(data);
    } catch {
      setComplianceStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const data = await batchesAPI.getAll();
        const list = Array.isArray(data) ? data : [];
        setBatches(
          list
            .filter((b: { id?: string }) => b?.id)
            .map((b: { id: string; batchId: string; productName: string; quantity: number; unit?: string }) => ({
              id: b.id,
              batchId: b.batchId,
              productName: b.productName,
              quantity: b.quantity,
              unit: b.unit,
            }))
        );
      } catch {
        setBatches([]);
      } finally {
        setBatchesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLabelRolls([]);
          return;
        }
        const res = await fetch(`${WEB_API_BASE}/material-control/my-label-rolls`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setLabelRolls([]);
          return;
        }
        const data = (await res.json()) as LabelRoll[];
        setLabelRolls(Array.isArray(data) ? data : []);
      } catch {
        setLabelRolls([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setComplianceStatus(null);
      return;
    }
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchComplianceStatus(selectedBatch);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBatch, fetchComplianceStatus]);

  useEffect(() => {
    if (!selectedBatch) return;
    if (batches.some((b) => b.id === selectedBatch)) return;
    setSelectedBatch('');
  }, [batches, selectedBatch]);

  useEffect(() => {
    if (!complianceStatus?.stickerRollId) return;
    if (showReplaceForm) {
      setStickerRollId((prev) => (prev ? prev : complianceStatus.stickerRollId || ''));
    }
  }, [complianceStatus?.stickerRollId, showReplaceForm]);

  const handleBatchChange = (id: string) => {
    setSelectedBatch(id);
    setShowReplaceForm(false);
    setPhotos({});
    setStickerRollId('');
    setError(null);
    setSuccess(null);
  };

  const handlePhotoUpload = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSuccess(null);
      setError(t('grower.compliancePhotos.errors.photoSize'));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotos((prev) => ({ ...prev, [type]: base64 }));
    };
    reader.readAsDataURL(file);
  };

  const handleVerifySticker = async () => {
    if (!selectedBatch || !stickerRollId) {
      setError(t('grower.compliancePhotos.errors.selectBatchAndSticker'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/material-control/verify-sticker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          stickerRollId,
          batchId: selectedBatch,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(messageFromApiPayload(errorData) || t('grower.compliancePhotos.errors.verifyFailed'));
      }

      setSuccess(t('grower.compliancePhotos.feedback.stickerVerified'));
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('grower.compliancePhotos.errors.verificationFailed'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError(null);
    setSuccess(null);

    const missingPhotos = requiredPhotos.filter((photo) => !photos[photo.type]);
    if (missingPhotos.length > 0) {
      setError(
        t('grower.compliancePhotos.errors.missingPhotos', {
          labels: missingPhotos.map((p) => p.label).join(', '),
        })
      );
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/material-control/compliance-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          stickerRollId,
          photos: requiredPhotos.map((photo) => photos[photo.type]),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(messageFromApiPayload(errorData) || t('grower.compliancePhotos.errors.uploadFailed'));
      }

      setSuccess(t('grower.compliancePhotos.feedback.saveSuccess'));
      setPhotos({});
      setShowReplaceForm(false);
      await fetchComplianceStatus(selectedBatch);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('grower.compliancePhotos.errors.genericUploadError'));
    } finally {
      setUploading(false);
    }
  };

  const showForm =
    Boolean(selectedBatch) &&
    (complianceStatus == null || !complianceStatus.complete || showReplaceForm) &&
    !statusLoading;

  const selectedBatchLabel = batches.find((b) => b.id === selectedBatch);

  return (
    <SidebarLayout title={t('grower.compliancePhotos.pageTitle')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title={t('grower.compliancePhotos.pageTitle')}
          description={t('grower.compliancePhotos.pageDescription')}
        />
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <p className="text-base text-red-800">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-[#f7faf6] border border-[#2D5A27]/20 rounded-lg"
          >
            <p className="text-base text-[#1a3d17]">{success}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('grower.compliancePhotos.checklistHeading')}</h2>
          <p className="text-base text-gray-600 mb-4">
            {t('grower.compliancePhotos.introBeforeStrong')}
            <strong>{t('grower.compliancePhotos.introStrong')}</strong>
            {t('grower.compliancePhotos.introAfterStrong')}
            <strong>{t('grower.compliancePhotos.introEmphasisOne')}</strong>
            {t('grower.compliancePhotos.introEnd')}
          </p>

          <div className="mb-6 rounded-lg border border-[#2D5A27]/20 bg-[#2D5A27]/5 p-4 text-base text-gray-800">
            <p className="font-medium text-gray-900 mb-2">{t('grower.compliancePhotos.explainerTitle')}</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {explainerBullets.map((bullet, i) => (
                <li key={i}>{bullet}</li>
              ))}
            </ul>
            <p className="mt-2 text-gray-700">
              {t('grower.compliancePhotos.idFormatHint')}{' '}
              <Link href="/grower/materials" className="text-[#2D5A27] font-medium underline">
                {t('grower.compliancePhotos.materialsLink')}
              </Link>
              . {t('grower.compliancePhotos.idFormatExample')}{' '}
              <code className="rounded bg-white px-1 py-0.5 text-xs">LABEL-ROLL-…</code>
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-base font-medium text-gray-700 mb-2">{t('grower.compliancePhotos.selectLot')}</label>
            {batchesLoading ? (
              <p className="text-base text-gray-500">{t('grower.compliancePhotos.loadingBatches')}</p>
            ) : batches.length === 0 ? (
              <p className="text-base text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-3">
                {t('grower.compliancePhotos.noBatches')}{' '}
                <Link href="/grower/batches" className="text-[#2D5A27] font-medium underline">
                  {t('grower.compliancePhotos.createBatch')}
                </Link>{' '}
                {t('grower.compliancePhotos.noBatchesSuffix')}
              </p>
            ) : (
              <select
                value={selectedBatch}
                onChange={(e) => handleBatchChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
              >
                <option value="">{t('grower.compliancePhotos.selectBatchPlaceholder')}</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchId} — {batch.productName} ({batch.quantity} {batch.unit || t('common.unitKg')})
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedBatch && statusLoading && (
            <p className="text-base text-gray-500 mb-4">{t('grower.compliancePhotos.loadingStatus')}</p>
          )}

          {selectedBatch && !statusLoading && complianceStatus?.complete && !showReplaceForm && (
            <div className="mb-6 rounded-xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                    {t('grower.compliancePhotos.resolvedBadge')}
                  </p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">
                    {t('grower.compliancePhotos.complianceCompleteTitle')}
                  </h3>
                  <p className="text-base text-gray-700 mt-1">
                    {t('grower.compliancePhotos.resolvedLotPrefix')}{' '}
                    <span className="font-mono font-medium">{complianceStatus.publicBatchId}</span>{' '}
                    {t('grower.compliancePhotos.resolvedBody')}
                  </p>
                </div>
                <div className="shrink-0 text-3xl" aria-hidden>
                  ✓
                </div>
              </div>
              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-base">
                <div>
                  <dt className="text-gray-500">{t('grower.compliancePhotos.stickerRollDt')}</dt>
                  <dd className="font-mono font-medium text-gray-900">
                    {complianceStatus.stickerRollId || t('common.emDash')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500">{t('grower.compliancePhotos.lastUpdated')}</dt>
                  <dd className="text-gray-900">
                    {complianceStatus.lastComplianceAt
                      ? new Date(complianceStatus.lastComplianceAt).toLocaleString()
                      : t('common.emDash')}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">{t('grower.compliancePhotos.photoTypesOnFile')}</dt>
                  <dd className="text-gray-900">
                    {complianceStatus.uploadedPhotoTypes?.length
                      ? complianceStatus.uploadedPhotoTypes.join(', ')
                      : t('common.emDash')}
                  </dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => {
                  setShowReplaceForm(true);
                  setStickerRollId(complianceStatus.stickerRollId || '');
                  setError(null);
                  setSuccess(null);
                }}
                className="mt-4 w-full sm:w-auto px-4 py-2 text-base font-medium border border-gray-300 rounded-lg text-gray-800 hover:bg-gray-50"
              >
                {t('grower.compliancePhotos.updatePhotosCta')}
              </button>
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">
                  {t('grower.compliancePhotos.stickerRollLabel')}
                </label>
                <select
                  value={pickableSerials.has(stickerRollId) ? stickerRollId : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v) setStickerRollId(v);
                  }}
                  className="w-full px-4 py-2 mb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
                >
                  <option value="">{t('grower.compliancePhotos.pickRollPlaceholder')}</option>
                  {labelRolls
                    .filter(
                      (r) =>
                        r.status === 'SOLD' ||
                        (r.status === 'USED' && r.serialNumber === complianceStatus?.stickerRollId)
                    )
                    .map((r) => (
                      <option key={r.serialNumber} value={r.serialNumber}>
                        {r.serialNumber}{' '}
                        {r.status === 'SOLD'
                          ? t('grower.compliancePhotos.rollAvailable')
                          : t('grower.compliancePhotos.rollOnLot')}
                      </option>
                    ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={stickerRollId}
                    onChange={(e) => setStickerRollId(e.target.value)}
                    placeholder={t('grower.compliancePhotos.stickerInputPlaceholder')}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2D5A27]/50 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={handleVerifySticker}
                    className="px-4 py-2 border-2 border-[#2D5A27] text-[#2D5A27] bg-white rounded-lg hover:bg-[#f7faf6] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D5A27]/50"
                  >
                    {t('grower.compliancePhotos.verify')}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('grower.compliancePhotos.stickerHelp')}</p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">
                  {t('grower.compliancePhotos.requiredPhotosHeading')}
                </h3>
                <div className="space-y-4">
                  {requiredPhotos.map((photo, index) => (
                    <div key={photo.type} className="space-y-2">
                      <label className="block text-base font-medium text-gray-700">{photo.label} *</label>
                      <p className="text-xs text-gray-500 mb-2">{photo.description}</p>
                      <div className="relative">
                        <input
                          ref={setFileInputRef(index)}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(photo.type, e)}
                          className="hidden"
                          id={`photo-${photo.type}`}
                        />
                        <label
                          htmlFor={`photo-${photo.type}`}
                          className="block w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#2D5A27]/50 transition-colors text-center"
                        >
                          {photos[photo.type] ? (
                            <div className="space-y-2">
                              <img
                                src={photos[photo.type]}
                                alt={photo.label}
                                className="w-full h-48 object-cover rounded mt-2"
                              />
                              <p className="text-base text-[#2D5A27]">
                                {t('grower.compliancePhotos.photoAddedPending')}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <svg
                                className="w-12 h-12 text-gray-400 mx-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <p className="text-base text-gray-500">
                                {t('grower.compliancePhotos.clickToUpload')}
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                {showReplaceForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowReplaceForm(false);
                      setPhotos({});
                      setStickerRollId(complianceStatus?.stickerRollId || '');
                      setError(null);
                      setSuccess(null);
                    }}
                    className="mb-3 text-base text-gray-600 hover:text-gray-900 underline"
                  >
                    {t('grower.compliancePhotos.cancelKeep')}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={
                    uploading ||
                    !selectedBatch ||
                    !stickerRollId ||
                    Object.keys(photos).length !== requiredPhotos.length
                  }
                  className="w-full px-6 py-3 bg-[#2D5A27] text-white font-medium rounded-lg hover:bg-[#23471f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading
                    ? t('grower.compliancePhotos.uploading')
                    : t('grower.compliancePhotos.saveSubmit')}
                </button>
                {showReplaceForm && selectedBatchLabel && (
                  <p className="text-xs text-amber-800 mt-2">
                    {t('grower.compliancePhotos.replaceWarning', { batchId: selectedBatchLabel.batchId })}
                  </p>
                )}
              </div>
            </form>
          )}

          {selectedBatch && !statusLoading && complianceStatus === null && (
            <p className="text-base text-amber-800">{t('grower.compliancePhotos.statusLoadError')}</p>
          )}
        </motion.div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
