import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { harvestAnnouncementsAPI } from '../../../lib/api';
import { loadGrowerParcelRows, type GrowerParcelRow } from '../../../lib/load-grower-parcels';
import { offlineStorage, PendingCost, PendingProduct } from '../../../lib/offline-storage';
import { isDeviceOnline } from '../../../lib/network-utils';
import { syncService } from '../../../lib/sync-service';
import { normalizeHarvestParcelId } from '../harvest/useHarvestData';
import type { CostPlantingOption } from './CostAllocationPicker';

type HarvestPlanRow = {
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  status: string;
  parcel?: { id?: string | null } | null;
};

function normalizePlan(r: Record<string, unknown>): HarvestPlanRow {
  const parcelRaw = r.parcel as HarvestPlanRow['parcel'] | null | undefined;
  const parcelId =
    normalizeHarvestParcelId(r.parcelId, parcelRaw ?? null) || String(r.parcelId ?? '').trim();
  const estimatedDate =
    typeof r.estimatedDate === 'string' && r.estimatedDate.trim()
      ? r.estimatedDate
      : r.estimatedDate instanceof Date
        ? r.estimatedDate.toISOString()
        : '';
  return {
    id: String(r.id ?? ''),
    parcelId,
    announcementType: String(r.announcementType ?? '').toUpperCase(),
    cropType: String(r.cropType ?? ''),
    estimatedDate,
    status: String(r.status ?? ''),
    parcel: parcelRaw ?? null,
  };
}

async function syncPortalQueuesIfOnline(): Promise<void> {
  if (!(await isDeviceOnline())) return;
  await Promise.all([
    syncService.syncPendingProducts(),
    syncService.syncPendingCosts(),
  ]);
}

export function useCostCalculatorData() {
  const { t } = useTranslation();
  const [costs, setCosts] = useState<PendingCost[]>([]);
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [parcels, setParcels] = useState<GrowerParcelRow[]>([]);
  const [harvestPlans, setHarvestPlans] = useState<HarvestPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [allocationLoading, setAllocationLoading] = useState(true);

  const loadAllocation = useCallback(async () => {
    setAllocationLoading(true);
    try {
      const [parcelRows, plansRaw] = await Promise.all([
        loadGrowerParcelRows({ approvedOnly: false, t }),
        harvestAnnouncementsAPI.getMy(),
      ]);
      setParcels(parcelRows);
      setHarvestPlans(
        (Array.isArray(plansRaw) ? plansRaw : []).map((r) =>
          normalizePlan(r as Record<string, unknown>),
        ),
      );
    } catch (error) {
      console.error('Error loading cost allocation options:', error);
      setParcels([]);
      setHarvestPlans([]);
    } finally {
      setAllocationLoading(false);
    }
  }, [t]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (silent) setListRefreshing(true);
    else setLoading(true);
    try {
      await syncPortalQueuesIfOnline();
      const [costList, productList] = await Promise.all([
        offlineStorage.getPendingCosts(),
        offlineStorage.getPendingProducts(),
      ]);
      setCosts(costList);
      setProducts(productList);
    } catch (error) {
      console.error('Error loading cost calculator data:', error);
      setCosts([]);
      setProducts([]);
    } finally {
      if (silent) setListRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([load(), loadAllocation()]);
  }, [load, loadAllocation]);

  const plantingsForParcel = useCallback(
    (parcelId: string): CostPlantingOption[] => {
      if (!parcelId) return [];
      return harvestPlans
        .filter(
          (a) =>
            a.announcementType === 'PLANTING' &&
            a.status !== 'CANCELLED' &&
            normalizeHarvestParcelId(a.parcelId, a.parcel ?? null) === parcelId,
        )
        .map((a) => {
          const dateStr = a.estimatedDate ? String(a.estimatedDate).slice(0, 10) : '—';
          return {
            id: a.id,
            label: `${a.cropType} · ${dateStr}`,
          };
        });
    },
    [harvestPlans],
  );

  const parcelById = useMemo(() => new Map(parcels.map((p) => [p.id, p])), [parcels]);

  const resolveAllocationLabels = useCallback(
    (parcelId: string, plantingId?: string) => {
      const parcel = parcelById.get(parcelId);
      const plantings = plantingsForParcel(parcelId);
      const planting = plantingId ? plantings.find((p) => p.id === plantingId) : undefined;
      return {
        estateId: parcel?.estateId ?? '',
        parcelLabel: parcel?.label ?? parcelId.slice(0, 8),
        plantingLabel: planting?.label,
      };
    },
    [parcelById, plantingsForParcel],
  );

  const addCost = useCallback(
    async (entry: Omit<PendingCost, 'id' | 'timestamp' | 'status'>) => {
      await offlineStorage.savePendingCost(entry);
      await syncPortalQueuesIfOnline();
      await load({ silent: true });
    },
    [load],
  );

  const transferProductAsCost = useCallback(
    async (
      product: PendingProduct,
      amount: number,
      allocation: { parcelId: string; estateId: string; harvestAnnouncementId?: string; parcelLabel: string; plantingLabel?: string },
    ) => {
      await offlineStorage.savePendingCost({
        type: 'product',
        productId: product.id,
        label: product.name,
        amount,
        currency: 'EUR',
        parcelId: allocation.parcelId,
        estateId: allocation.estateId,
        harvestAnnouncementId: allocation.harvestAnnouncementId,
        parcelLabel: allocation.parcelLabel,
        plantingLabel: allocation.plantingLabel,
      });
      await syncPortalQueuesIfOnline();
      await load({ silent: true });
    },
    [load],
  );

  const removeCost = useCallback(
    async (id: string) => {
      await offlineStorage.removeCost(id);
      await load({ silent: true });
    },
    [load],
  );

  const refreshAll = useCallback(async () => {
    await Promise.all([load({ silent: true }), loadAllocation()]);
  }, [load, loadAllocation]);

  return {
    costs,
    products,
    parcels,
    allocationLoading,
    plantingsForParcel,
    resolveAllocationLabels,
    loading,
    listRefreshing,
    load,
    refreshAll,
    addCost,
    transferProductAsCost,
    removeCost,
  };
}
