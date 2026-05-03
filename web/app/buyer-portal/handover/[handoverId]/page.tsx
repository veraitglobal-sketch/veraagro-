'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '@/components/SidebarLayout';
import AuthGuard from '@/components/AuthGuard';
import { useBuyerPortalNavItems } from '@/lib/buyer-portal-nav';
import { useAuth } from '@/lib/auth';
import { digitalHandoverAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { compressImage } from '@/lib/image-compression';
import { Loader2 } from 'lucide-react';

const SIG_W = 480;
const SIG_H = 160;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MIN_PHOTOS = 2;
const MAX_PHOTOS = 8;

/** Parse inputs like "5,2" or "5.2" (sr-RS). */
function parseLocaleTemperature(raw: string): number {
  const normalized = raw.trim().replace(/\s/g, '').replace(',', '.');
  return parseFloat(normalized);
}

function readFileAsDataUrl(file: File, readFailedMessage: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error(readFailedMessage));
    r.readAsDataURL(file);
  });
}

function getSigPos(
  e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  if ('touches' in e && e.touches[0]) {
    return {
      x: (e.touches[0].clientX - rect.left) * scaleX,
      y: (e.touches[0].clientY - rect.top) * scaleY,
    };
  }
  const me = e as React.MouseEvent<HTMLCanvasElement>;
  return {
    x: (me.clientX - rect.left) * scaleX,
    y: (me.clientY - rect.top) * scaleY,
  };
}

export default function BuyerHandoverCompletePage() {
  const { t } = useTranslation();
  const navItems = useBuyerPortalNavItems();
  const router = useRouter();
  const params = useParams();
  const handoverIdRaw = typeof params?.handoverId === 'string' ? params.handoverId : '';
  const { user, isLoading: authLoading } = useAuth();

  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const sigDrawing = useRef(false);
  const sigHasInk = useRef(false);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [payload, setPayload] = useState<{
    id: string;
    status: string;
    deliveries?: {
      deliveryNumber?: string;
      orders?: {
        buyerId?: string;
        orderNumber?: string;
      };
    };
  } | null>(null);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoErr, setPhotoErr] = useState<string | null>(null);
  const [temperature, setTemperature] = useState('');
  const [visual, setVisual] = useState<'FRESH' | 'DAMAGED' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const initSigCanvas = useCallback(() => {
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIG_W, SIG_H);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    initSigCanvas();
  }, [initSigCanvas, payload?.id]);

  const load = useCallback(async () => {
    if (!handoverIdRaw) {
      setLoadErr(t('buyerPortalHandover.errNoId'));
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadErr(null);
    try {
      const data = await digitalHandoverAPI.getOne(handoverIdRaw);
      setPayload(data);
    } catch (e: unknown) {
      setPayload(null);
      setLoadErr(apiErrorOrT(e, t, 'common.apiErrorGeneric'));
    } finally {
      setLoading(false);
    }
  }, [handoverIdRaw, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onPhotoFiles = async (files: FileList | null) => {
    setPhotoErr(null);
    if (!files?.length) return;
    const next = [...photoUrls];
    const readFailed = t('buyerPortalHandover.photoReadFailed');
    for (let i = 0; i < files.length; i++) {
      if (next.length >= MAX_PHOTOS) break;
      const f = files[i];
      if (!f.type.startsWith('image/')) {
        setPhotoErr(t('buyerPortalHandover.photoOnlyImages'));
        return;
      }
      if (f.size > MAX_PHOTO_BYTES) {
        setPhotoErr(t('buyerPortalHandover.photoTooLarge'));
        return;
      }
      try {
        const compressed = await compressImage(f, {
          maxWidth: 1600,
          maxHeight: 1600,
          maxSizeMB: 1.5,
          quality: 0.82,
          useWebWorker: true,
        });
        const dataUrl = await readFileAsDataUrl(compressed, readFailed);
        next.push(dataUrl);
      } catch {
        setPhotoErr(readFailed);
        return;
      }
    }
    setPhotoUrls(next);
  };

  const startSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    sigDrawing.current = true;
    sigHasInk.current = true;
    const p = getSigPos(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const moveSig = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!sigDrawing.current) return;
    const c = sigCanvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = getSigPos(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const endSig = () => {
    sigDrawing.current = false;
  };

  const clearSig = () => {
    sigHasInk.current = false;
    initSigCanvas();
  };

  const canSubmitElevated =
    user?.roles?.includes('SUPER_ADMIN') || user?.roles?.includes('ADMIN');
  const buyerIdLinked = payload?.deliveries?.orders?.buyerId;
  const accessOk =
    canSubmitElevated || (buyerIdLinked && user?.id && buyerIdLinked === user.id);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitErr(null);
    if (!handoverIdRaw || !payload) return;

    if (!accessOk) {
      setSubmitErr(t('buyerPortalHandover.errNotYourOrder'));
      return;
    }

    const st = payload.status?.toUpperCase();
    if (st !== 'INITIATED' && st !== 'IN_PROGRESS') {
      setSubmitErr(t('buyerPortalHandover.errAlreadyFinished'));
      return;
    }

    if (photoUrls.length < MIN_PHOTOS) {
      setSubmitErr(t('buyerPortalHandover.errPhotosMin', { count: MIN_PHOTOS }));
      return;
    }
    if (!visual) {
      setSubmitErr(t('buyerPortalHandover.errVisual'));
      return;
    }
    const temp = parseLocaleTemperature(temperature);
    if (!Number.isFinite(temp)) {
      setSubmitErr(t('buyerPortalHandover.errTemperature'));
      return;
    }

    let signaturePayload: string | undefined;
    if (visual === 'FRESH') {
      const c = sigCanvasRef.current;
      if (!sigHasInk.current || !c) {
        setSubmitErr(t('buyerPortalHandover.errSignature'));
        return;
      }
      try {
        signaturePayload = c.toDataURL('image/jpeg', 0.85);
      } catch {
        setSubmitErr(t('buyerPortalHandover.errSignature'));
        return;
      }
      if (!signaturePayload || signaturePayload.length < 80) {
        setSubmitErr(t('buyerPortalHandover.errSignature'));
        return;
      }
    }

    setSubmitting(true);
    try {
      await digitalHandoverAPI.complete({
        handoverId: handoverIdRaw,
        qualityCheck: {
          visualCheck: visual,
          temperature: temp,
          photoUrls,
          ...(signaturePayload ? { signature: signaturePayload } : {}),
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        },
      });
      router.push('/buyer-portal/deliveries');
    } catch (err: unknown) {
      setSubmitErr(apiErrorOrT(err, t, 'common.apiErrorGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AuthGuard requiredRoles={['BUYER', 'ADMIN', 'SUPER_ADMIN']}>
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#2D5A27]" aria-hidden />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRoles={['BUYER', 'ADMIN', 'SUPER_ADMIN']}>
      <SidebarLayout title={t('buyerPortalHandover.pageTitle')} navItems={navItems}>
        <div className="mx-auto max-w-2xl space-y-6 p-5 sm:p-6">
          <div className="border-b border-gray-200 pb-4">
            <h1 className="text-xl font-semibold text-gray-900">{t('buyerPortalHandover.heading')}</h1>
            <p className="mt-2 text-sm text-gray-600 font-light">{t('buyerPortalHandover.lead')}</p>
            <Link
              href="/buyer-portal/deliveries"
              className="mt-3 inline-block text-sm font-medium text-[#2D5A27] hover:underline"
            >
              ← {t('buyerPortalHandover.backDeliveries')}
            </Link>
          </div>

          {loading && (
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>{t('buyerPortalHandover.loading')}</span>
            </div>
          )}

          {loadErr && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{loadErr}</div>
          )}

          {!loading && payload && (
            <>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-gray-600">
                  {t('buyerPortalHandover.orderMeta', {
                    order: payload.deliveries?.orders?.orderNumber ?? '—',
                    delivery: payload.deliveries?.deliveryNumber ?? '—',
                  })}
                </p>
              </div>

              {!accessOk && (
                <p className="text-sm text-amber-900 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  {t('buyerPortalHandover.errNotYourOrder')}
                </p>
              )}

              {(payload.status === 'INITIATED' || payload.status === 'IN_PROGRESS') && accessOk && (
                <form onSubmit={onSubmit} className="space-y-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">{t('buyerPortalHandover.photosLabel')}</label>
                    <p className="text-xs text-gray-500 mb-2">{t('buyerPortalHandover.photosHint', { min: MIN_PHOTOS, max: MAX_PHOTOS })}</p>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      disabled={submitting || photoUrls.length >= MAX_PHOTOS}
                      onChange={(ev) => onPhotoFiles(ev.target.files)}
                      className="block w-full text-sm text-gray-800 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2D5A27] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                    />
                    {photoErr && <p className="mt-2 text-sm text-red-700">{photoErr}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="relative">
                          <img src={url} alt="" className="h-20 w-20 rounded border border-gray-200 object-cover" />
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => setPhotoUrls((p) => p.filter((_, j) => j !== i))}
                            className="absolute -right-2 -top-2 rounded-full bg-gray-900 px-2 py-0.5 text-xs text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="block text-sm font-medium text-gray-900 mb-2">{t('buyerPortalHandover.visualLabel')}</span>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 has-[:checked]:border-[#2D5A27]">
                        <input type="radio" name="vz" checked={visual === 'FRESH'} onChange={() => setVisual('FRESH')} />
                        <span>{t('buyerPortalHandover.freshOk')}</span>
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 has-[:checked]:border-red-500">
                        <input type="radio" name="vz" checked={visual === 'DAMAGED'} onChange={() => setVisual('DAMAGED')} />
                        <span>{t('buyerPortalHandover.damaged')}</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dock-temp" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('buyerPortalHandover.temperatureLabel')}
                    </label>
                    <input
                      id="dock-temp"
                      type="text"
                      inputMode="decimal"
                      value={temperature}
                      onChange={(ev) => setTemperature(ev.target.value)}
                      placeholder={t('buyerPortalHandover.temperaturePlaceholder')}
                      disabled={submitting}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>

                  {visual === 'FRESH' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-gray-900">{t('buyerPortalHandover.signatureLabel')} *</label>
                        <button type="button" onClick={clearSig} className="text-sm text-[#2D5A27] hover:underline">
                          {t('buyerPortalHandover.signatureClear')}
                        </button>
                      </div>
                      <canvas
                        ref={sigCanvasRef}
                        width={SIG_W}
                        height={SIG_H}
                        className="touch-none max-w-full rounded-lg border border-gray-300 bg-white"
                        style={{ height: SIG_H }}
                        onMouseDown={startSig}
                        onMouseMove={moveSig}
                        onMouseUp={endSig}
                        onMouseLeave={endSig}
                        onTouchStart={startSig}
                        onTouchMove={moveSig}
                        onTouchEnd={endSig}
                      />
                      <p className="mt-2 text-xs text-gray-500">{t('buyerPortalHandover.signatureHint')}</p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="dock-notes" className="block text-sm font-medium text-gray-900 mb-2">
                      {t('buyerPortalHandover.notesLabel')}
                    </label>
                    <textarea
                      id="dock-notes"
                      rows={3}
                      value={notes}
                      onChange={(ev) => setNotes(ev.target.value)}
                      placeholder={t('buyerPortalHandover.notesPlaceholder')}
                      disabled={submitting}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base text-gray-900 focus:border-[#2D5A27] focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/25"
                    />
                  </div>

                  {submitErr && <p className="text-sm text-red-700">{submitErr}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-[#2D5A27] px-4 text-base font-semibold text-white hover:bg-[#23471f] disabled:opacity-50"
                  >
                    {submitting ? t('buyerPortalHandover.submitting') : t('buyerPortalHandover.submit')}
                  </button>
                </form>
              )}

              {payload.status !== 'INITIATED' && payload.status !== 'IN_PROGRESS' && (
                <p className="text-sm text-gray-700">{t('buyerPortalHandover.viewOnlyFinished')}</p>
              )}
            </>
          )}
        </div>
      </SidebarLayout>
    </AuthGuard>
  );
}
