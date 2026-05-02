'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SidebarLayout from '@/components/SidebarLayout';
import { useAuth } from '@/lib/auth';
import { missionsAPI } from '@/lib/api';
import { apiErrorOrT } from '@/lib/api-error';
import { WEB_API_BASE } from '@/lib/api-base';
import { useLogisticsPartnerNavItems } from '@/lib/logistics-nav';
import { GrowerPageHeader, GrowerPageShell } from '@/components/grower/GrowerPageShell';
import { Loader2, FileText } from 'lucide-react';

/** Missions that already completed loading handover (have logistics_handovers row). */
const AFTER_LOADING_HANDOVER: string[] = [
  'READY_FOR_LOADING',
  'PICKED_UP',
  'IN_TRANSIT',
  'COMPLETED',
];

const CANVAS_W = 560;
const CANVAS_H = 200;

interface Mission {
  id: string;
  missionNumber: string;
  status: string;
  batchId?: string | null;
  batches?: { batchId?: string } | null;
}

function getPos(
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

export default function LogisticsHandoverReceiverPage() {
  const { t } = useTranslation();
  const navItems = useLogisticsPartnerNavItems();
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [missionsLoading, setMissionsLoading] = useState(true);
  const [missionsFetchError, setMissionsFetchError] = useState<string | null>(null);
  const [selectedMission, setSelectedMission] = useState<string>('');
  const [receiverName, setReceiverName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pdfOpening, setPdfOpening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  const initCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login/producer');
      return;
    }
    const roles = user?.roles && Array.isArray(user.roles) ? user.roles : [];
    if (!roles.includes('LOGISTICS_PARTNER')) {
      router.replace('/');
      return;
    }
  }, [isAuthenticated, isLoading, user, router]);

  const refreshMissions = () => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    setMissionsFetchError(null);
    missionsAPI
      .getMyMissions('logistics')
      .then((data: Mission[]) => {
        const list = (Array.isArray(data) ? data : []).filter((m) =>
          AFTER_LOADING_HANDOVER.includes(m.status),
        );
        setMissions(list);
        setMissionsFetchError(null);
      })
      .catch((err: unknown) => {
        setMissions([]);
        setMissionsFetchError(apiErrorOrT(err, t, 'logisticsPages.missionsPageLoadError'));
      });
  };

  useEffect(() => {
    if (!isAuthenticated || !user?.roles?.includes('LOGISTICS_PARTNER')) return;
    let cancelled = false;
    setMissionsLoading(true);
    setMissionsFetchError(null);
    missionsAPI
      .getMyMissions('logistics')
      .then((data: Mission[]) => {
        if (!cancelled) {
          const list = (Array.isArray(data) ? data : []).filter((m) =>
            AFTER_LOADING_HANDOVER.includes(m.status),
          );
          setMissions(list);
          setMissionsFetchError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setMissions([]);
          setMissionsFetchError(apiErrorOrT(err, t, 'logisticsPages.missionsPageLoadError'));
        }
      })
      .finally(() => {
        if (!cancelled) setMissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.roles, t]);

  useEffect(() => {
    initCanvas();
  }, [initCanvas, success]);

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    drawing.current = true;
    const p = getPos(e, c);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };

  const moveDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const p = getPos(e, c);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const openReceiverPdf = async (missionId: string) => {
    setPdfOpening(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${WEB_API_BASE}/quality-entry/handover/mission/${encodeURIComponent(missionId)}/receiver-pdf`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const errorData = await res.json();
          const m = errorData?.message;
          msg = Array.isArray(m) ? m.join(' ') : (m || errorData?.error || msg);
        } catch {
          const bodyText = await res.text();
          if (bodyText?.trim()) msg = bodyText.slice(0, 500);
        }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank');
      if (w) {
        w.addEventListener('beforeunload', () => URL.revokeObjectURL(url));
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `handover-receiver-${missionId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'logisticsPages.receiverErrPdf'));
    } finally {
      setPdfOpening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!selectedMission) {
      setError(t('logisticsPages.receiverErrSelectMission'));
      setSubmitting(false);
      return;
    }
    if (!receiverName.trim()) {
      setError(t('logisticsPages.receiverErrName'));
      setSubmitting(false);
      return;
    }

    const c = canvasRef.current;
    let receiverSignatureDataUrl: string | undefined;
    if (c) {
      const ctx = c.getContext('2d');
      if (ctx) {
        const data = ctx.getImageData(0, 0, c.width, c.height);
        let hasInk = false;
        for (let i = 3; i < data.data.length; i += 4) {
          if (data.data[i]! < 255) {
            hasInk = true;
            break;
          }
        }
        if (hasInk) {
          receiverSignatureDataUrl = c.toDataURL('image/png');
        }
      }
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${WEB_API_BASE}/quality-entry/handover/receiver-proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          missionId: selectedMission,
          receiverName: receiverName.trim(),
          receiverSignatureDataUrl,
        }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          const m = errorData?.message;
          msg = Array.isArray(m) ? m.join(' ') : (m || errorData?.error || msg);
        } catch {
          const bodyText = await response.text();
          if (bodyText?.trim()) msg = bodyText.slice(0, 500);
        }
        throw new Error(msg);
      }

      setSuccess(true);
      setReceiverName('');
      initCanvas();
      setTimeout(() => {
        setSelectedMission('');
        setSuccess(false);
        refreshMissions();
      }, 4000);
    } catch (err: unknown) {
      setError(apiErrorOrT(err, t, 'logisticsPages.receiverErrSave'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <SidebarLayout title={t('logisticsPages.receiverProof')} navItems={navItems}>
        <GrowerPageShell>
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#2D5A27]" aria-hidden />
          </div>
        </GrowerPageShell>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout title={t('logisticsPages.receiverProof')} navItems={navItems}>
      <GrowerPageShell className="space-y-6">
        <GrowerPageHeader
          title={t('logisticsPages.receiverHeaderTitle')}
          description={t('logisticsPages.receiverHeaderDescription')}
        />

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950">
          <p className="font-semibold">{t('logisticsPages.receiverPrereqTitle')}</p>
          <p className="mt-1 leading-relaxed">{t('logisticsPages.receiverPrereqBody')}</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">{t('common.error')}</p>
            <p className="mt-1 text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-[#2D5A27]/30 bg-[#2D5A27]/10 p-4">
            <p className="text-sm text-[#23471f]">{t('logisticsPages.receiverSuccessMessage')}</p>
          </div>
        )}

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold text-gray-900">{t('logisticsPages.receiverFormTitle')}</h2>
          <p className="mb-6 text-sm text-gray-600">{t('logisticsPages.receiverFormLead')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('logisticsPages.receiverMissionLabel')}
              </label>
              <select
                value={selectedMission}
                onChange={(e) => setSelectedMission(e.target.value)}
                required
                disabled={missionsLoading}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
              >
                <option value="">
                  {missionsLoading
                    ? t('logisticsPages.receiverMissionsLoading')
                    : missions.length === 0
                      ? t('logisticsPages.receiverMissionsEmpty')
                      : t('logisticsPages.receiverMissionPlaceholder')}
                </option>
                {missions.map((mission) => (
                  <option key={mission.id} value={mission.id}>
                    {t('logisticsPages.receiverMissionOption', {
                      missionNumber: mission.missionNumber,
                      batchId: mission.batches?.batchId || mission.batchId || t('common.emDash'),
                      status: t(`admin.missions.statuses.${mission.status}`, {
                        defaultValue: mission.status.replace(/_/g, ' '),
                      }),
                    })}
                  </option>
                ))}
              </select>
              {missionsFetchError && (
                <p className="mt-2 text-sm text-red-700">{missionsFetchError}</p>
              )}
              {!missionsLoading && missions.length === 0 && !missionsFetchError && (
                <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/80 p-3 text-sm text-emerald-950 space-y-2">
                  <p>{t('logisticsPages.receiverMissionsEmptyHint')}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href="/logistics-partner/handover"
                      className="font-medium text-[#2D5A27] underline underline-offset-2"
                    >
                      {t('logisticsPages.receiverMissionsEmptyCtaHandover')}
                    </Link>
                    <Link
                      href="/logistics-partner/missions"
                      className="font-medium text-[#2D5A27] underline underline-offset-2"
                    >
                      {t('logisticsPages.receiverMissionsEmptyCtaMissions')}
                    </Link>
                    <Link
                      href="/logistics-partner/dashboard"
                      className="font-medium text-[#2D5A27] underline underline-offset-2"
                    >
                      {t('logisticsPages.receiverMissionsEmptyCtaDashboard')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('logisticsPages.receiverNameLabel')}
              </label>
              <input
                type="text"
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-[#2D5A27]"
                placeholder={t('logisticsPages.receiverNamePlaceholder')}
                autoComplete="name"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  {t('logisticsPages.receiverSignatureLabel')}
                </span>
                <button
                  type="button"
                  onClick={() => initCanvas()}
                  className="text-sm text-[#2D5A27] underline hover:text-[#23471f]"
                >
                  {t('logisticsPages.receiverSignatureClear')}
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
                <canvas
                  ref={canvasRef}
                  width={CANVAS_W}
                  height={CANVAS_H}
                  className="h-[160px] w-full max-w-2xl touch-none cursor-crosshair"
                  onMouseDown={startDraw}
                  onMouseMove={moveDraw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={moveDraw}
                  onTouchEnd={endDraw}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('logisticsPages.receiverSignatureHint')}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <button
                type="submit"
                disabled={submitting || !selectedMission || !receiverName.trim()}
                className="w-full rounded-lg bg-[#2D5A27] px-6 py-3 font-medium text-white transition-colors hover:bg-[#23471f] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? t('logisticsPages.receiverSubmitSaving') : t('logisticsPages.receiverSubmit')}
              </button>
            </div>
          </form>

          {selectedMission && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">{t('logisticsPages.receiverPdfSection')}</p>
              <button
                type="button"
                disabled={pdfOpening}
                onClick={() => void openReceiverPdf(selectedMission)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
              >
                {pdfOpening ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                {t('logisticsPages.receiverPdfButton')}
              </button>
            </div>
          )}
        </div>
      </GrowerPageShell>
    </SidebarLayout>
  );
}
