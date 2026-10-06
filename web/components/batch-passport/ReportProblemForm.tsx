'use client';

import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WEB_API_BASE } from '@/lib/api-base';

export default function ReportProblemForm({
  batchId,
  badgeSerial,
}: {
  batchId: string;
  badgeSerial?: string | null;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ reportNumber: string; duplicate?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef(`web-${Date.now()}-${Math.random().toString(36).slice(2)}`);

  const onPhoto = (file: File | null) => {
    if (!file) {
      setPhotoDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoDataUrl(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!description.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const qs = badgeSerial ? `?badge=${encodeURIComponent(badgeSerial)}` : '';
      const res = await fetch(`${WEB_API_BASE}/qr/verify/${encodeURIComponent(batchId)}/report${qs}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: description.trim(),
          contactEmail: contactEmail.trim() || undefined,
          photoDataUrl: photoDataUrl ?? undefined,
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const raw = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof raw.message === 'string' ? raw.message : t('passportPublic.report.error'));
      setResult({ reportNumber: raw.reportNumber, duplicate: raw.duplicate });
      setDescription('');
      setContactEmail('');
      setPhotoDataUrl(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('passportPublic.report.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        {t('passportPublic.report.confirm', { number: result.reportNumber })}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left text-base font-medium text-gray-900 min-h-[48px]"
      >
        {t('passportPublic.report.title')}
      </button>
      {open ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-gray-600">{t('passportPublic.report.lead')}</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-[#2D5A27] focus:ring-2 focus:ring-[#2D5A27]/25"
            placeholder={t('passportPublic.report.descriptionPlaceholder')}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onPhoto(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder={t('passportPublic.report.contactOptional')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="button"
            disabled={submitting || !description.trim()}
            onClick={() => void submit()}
            className="min-h-[48px] w-full rounded-lg bg-[#2D5A27] px-4 text-white hover:bg-[#23471f] disabled:opacity-50"
          >
            {submitting ? t('passportPublic.report.submitting') : t('passportPublic.report.submit')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
