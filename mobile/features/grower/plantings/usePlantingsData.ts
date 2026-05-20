import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { harvestAnnouncementsAPI } from '../../../lib/api';
import { growerOfflineCache } from '../../../lib/grower-offline-cache';
import { loadGrowerParcelRows, type GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { offlineStorage } from '../../../lib/offline-storage';
import { apiErrorMessage, axiosLikeMessage, axiosResponseStatus, isLikelyNetworkError } from '../../../lib/api-error';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

export type ParcelAug = GrowerParcelRow;

export type HaRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  notes?: string | null;
  createdAt?: string;
  estimatedQuantity?: number | null;
  localQueue?: {
    pendingId: string;
    queueStatus: 'pending' | 'syncing' | 'synced' | 'error';
    queueError?: string;
  };
  plantingProgress?: {
    intervalDays: number;
    lastGrowthLogAt: string | null;
    nextDueAt: string;
    isOverdue: boolean;
    daysOverdue: number;
  } | null;
  parcel?: {
    id: string;
    cropType?: string | null;
    calculatedArea?: number;
    estates?: { name: string } | null;
  } | null;
};

function isoString(d: unknown): string {
  if (typeof d === 'string' && d.trim()) return d;
  if (d instanceof Date && !Number.isNaN(d.getTime())) return d.toISOString();
  return '';
}

function normalizeServerRow(r: Record<string, unknown>): HaRow {
  const parcelRaw = r.parcel as HaRow['parcel'] | null | undefined;
  const parcelId =
    normalizeHarvestParcelId(r.parcelId, parcelRaw ?? null) || String(r.parcelId ?? '').trim();
  return {
    id: String(r.id ?? ''),
    parcelId,
    announcementType: String(r.announcementType ?? '').toUpperCase(),
    cropType: String(r.cropType ?? ''),
    estimatedDate: isoString(r.estimatedDate) || new Date(0).toISOString(),
    status: String(r.status ?? ''),
    notes: (r.notes as string | null) ?? null,
    createdAt: isoString(r.createdAt) || undefined,
    estimatedQuantity: typeof r.estimatedQuantity === 'number' ? r.estimatedQuantity : null,
    plantingProgress: (r.plantingProgress as HaRow['plantingProgress']) ?? null,
    parcel: parcelRaw
      ? {
          id: String(parcelRaw.id ?? parcelId),
          cropType: parcelRaw.cropType,
          calculatedArea:
            typeof (parcelRaw as { calculatedArea?: number }).calculatedArea === 'number'
              ? (parcelRaw as { calculatedArea?: number }).calculatedArea
              : undefined,
          estates: parcelRaw.estates ?? null,
        }
      : null,
  };
}

async function localPlantingRows(): Promise<HaRow[]> {
  const pending = await offlineStorage.getPendingHarvestPlans();
  return pending
    .filter((h) => String(h.payload?.announcementType ?? '').toUpperCase() === 'PLANTING')
    .map((h) => {
      const payload = h.payload;
      const q = h.status;
      const statusFlag =
        q === 'error' ? 'LOCAL_ERROR' : q === 'syncing' ? 'LOCAL_SYNCING' : 'LOCAL_QUEUED';
      return {
        id: `local:${h.id}`,
        parcelId: normalizeHarvestParcelId(payload.parcelId, null) || String(payload.parcelId ?? ''),
        announcementType: 'PLANTING',
        cropType: payload.cropType,
        estimatedDate: payload.estimatedDate,
        status: statusFlag,
        notes: payload.notes ?? null,
        createdAt: h.createdAt,
        estimatedQuantity: payload.estimatedQuantity ?? null,
        localQueue: { pendingId: h.id, queueStatus: q, queueError: h.error },
      };
    });
}

function explainLoadFailure(err: unknown, translate: (key: string) => string): string {
  const code =
    err && typeof err === 'object' && 'code' in err ? String((err as { code?: unknown }).code) : '';
  if (code === 'ECONNABORTED' || (err instanceof Error && /timeout/i.test(err.message))) {
    return translate('producer.plantings.announcementsLoadHintTimeout');
  }
  if (isLikelyNetworkError(err)) {
    return translate('producer.plantings.announcementsLoadHintNetwork');
  }
  const status = axiosResponseStatus(err);
  if (status === 401 || status === 403) {
    return translate('producer.plantings.announcementsLoadHintSession');
  }
  const raw = (axiosLikeMessage(err) || apiErrorMessage(err, '') || '').trim();
  if (raw.length > 2) return raw.length > 380 ? `${raw.slice(0, 377)}…` : raw;
  return translate('producer.plantings.announcementsLoadHintGeneric');
}

export function usePlantingsData() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [announcementsWarn, setAnnouncementsWarn] = useState<string | null>(null);
  const [announcementsWarnDetail, setAnnouncementsWarnDetail] = useState<string | null>(null);
  const [announcements, setAnnouncements] = useState<HaRow[]>([]);
  const [parcelList, setParcelList] = useState<ParcelAug[]>([]);

  const loadAnnouncements = useCallback(async (): Promise<{
    rows: HaRow[];
    warn: string | null;
    warnDetail: string | null;
  }> => {
    const local = await localPlantingRows();
    try {
      const list = await harvestAnnouncementsAPI.getMy();
      const serverRows = (Array.isArray(list) ? list : []).map((r) =>
        normalizeServerRow(r as Record<string, unknown>),
      );
      await growerOfflineCache.saveHarvestAnnouncements(serverRows);
      return { rows: [...local, ...serverRows], warn: null, warnDetail: null };
    } catch (e: unknown) {
      if (__DEV__) {
        console.warn('[usePlantingsData] getMy failed:', axiosLikeMessage(e) || e);
      }
      const cached = await growerOfflineCache.loadHarvestAnnouncements();
      const cachedRows = (cached ?? []).map((r) =>
        normalizeServerRow(r as unknown as Record<string, unknown>),
      );
      const rows = cachedRows.length > 0 ? [...local, ...cachedRows] : local;
      return {
        rows,
        warn:
          rows.length > 0
            ? t('producer.plantings.announcementsLoadWarnOffline')
            : t('producer.plantings.announcementsLoadWarn'),
        warnDetail: explainLoadFailure(e, t),
      };
    }
  }, [t]);

  const load = useCallback(async () => {
    setErr(null);
    setAnnouncementsWarn(null);
    setAnnouncementsWarnDetail(null);
    try {
      const [parcelRows, ann] = await Promise.all([
        loadGrowerParcelRows({ t }),
        loadAnnouncements(),
      ]);
      setParcelList(parcelRows);
      setAnnouncements(ann.rows);
      setAnnouncementsWarn(ann.warn);
      setAnnouncementsWarnDetail(ann.warnDetail);
    } catch (e) {
      setErr(e instanceof Error ? e.message : t('producer.plantings.loadError'));
      const local = await localPlantingRows();
      setAnnouncements(local);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadAnnouncements, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void load();
  }, [load]);

  return {
    loading,
    refreshing,
    err,
    announcementsWarn,
    announcementsWarnDetail,
    announcements,
    parcelList,
    reload: load,
  };
}
