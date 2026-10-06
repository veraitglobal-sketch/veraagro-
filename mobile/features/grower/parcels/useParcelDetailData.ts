import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fieldEntriesAPI, type FieldEntry } from '../../../lib/api';
import { loadGrowerParcelRows, type GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { usePlantingsData, type HaRow } from '../plantings/usePlantingsData';
import { isParcelApproved } from '../dashboard/useHomeParcels';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';

export function useParcelDetailData(parcelId: string | undefined) {
  const { t } = useTranslation();
  const [parcel, setParcel] = useState<GrowerParcelRow | null>(null);
  const [parcelLoaded, setParcelLoaded] = useState(false);
  const [recentEntries, setRecentEntries] = useState<FieldEntry[]>([]);
  const [entriesLoaded, setEntriesLoaded] = useState(false);

  const {
    loading: plantingsLoading,
    refreshing,
    announcements,
    reload: reloadPlantings,
  } = usePlantingsData();

  const loadParcel = useCallback(async () => {
    if (!parcelId) {
      setParcel(null);
      setParcelLoaded(true);
      return;
    }
    try {
      const rows = await loadGrowerParcelRows({ t });
      setParcel(rows.find((r) => r.id === parcelId) ?? null);
    } catch {
      setParcel(null);
    } finally {
      setParcelLoaded(true);
    }
  }, [parcelId, t]);

  useEffect(() => {
    setParcelLoaded(false);
    void loadParcel();
  }, [loadParcel]);

  useEffect(() => {
    if (!parcelLoaded || !parcelId) return;
    let cancelled = false;
    setEntriesLoaded(false);
    void (async () => {
      if (!parcel?.estateId) {
        if (!cancelled) {
          setRecentEntries([]);
          setEntriesLoaded(true);
        }
        return;
      }
      try {
        const rows = await fieldEntriesAPI.getAll(parcel.estateId, parcelId, 8);
        if (!cancelled) setRecentEntries(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setRecentEntries([]);
      } finally {
        if (!cancelled) setEntriesLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parcelLoaded, parcelId, parcel?.estateId]);

  const plantings = useMemo(() => {
    if (!parcelId) return [] as HaRow[];
    return announcements
      .filter((a) => {
        if (String(a.announcementType ?? '').toUpperCase() !== 'PLANTING') return false;
        const pid = normalizeHarvestParcelId(a.parcelId, a.parcel ?? null) || String(a.parcelId ?? '');
        return pid === parcelId;
      })
      .sort((a, b) => {
        const ta = new Date(a.createdAt || a.estimatedDate).getTime();
        const tb = new Date(b.createdAt || b.estimatedDate).getTime();
        return tb - ta;
      });
  }, [announcements, parcelId]);

  const approved = parcel ? isParcelApproved(parcel) : false;

  const reload = useCallback(async () => {
    setParcelLoaded(false);
    await Promise.all([loadParcel(), reloadPlantings()]);
  }, [loadParcel, reloadPlantings]);

  return {
    parcel,
    parcelLoaded,
    approved,
    plantings,
    plantingsLoading: plantingsLoading || !parcelLoaded,
    refreshing,
    recentEntries,
    entriesLoaded,
    reload,
  };
}
