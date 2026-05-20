import { estatesAPI, parcelsAPI, type Estate, type Parcel } from './api';
import { growerOfflineCache } from './grower-offline-cache';

export type GrowerParcelRow = {
  id: string;
  cropType?: string | null;
  approvedAt?: string | null;
  status?: string | null;
  estateId: string;
  calculatedArea?: number;
  estateName: string;
  label: string;
};

function mergeParcelsForEstate(
  fromApi: Parcel[],
  fromNest: Parcel[],
): Parcel[] {
  const merged = new Map<string, Parcel>();
  for (const p of [...fromApi, ...fromNest]) merged.set(p.id, p);
  return [...merged.values()];
}

function displayLabel(
  parcel: Parcel,
  estateName: string,
  multiEstate: boolean,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const crop =
    parcel.cropType?.trim() ||
    t('producer.growthJournal.parcelShort', { id: parcel.id.slice(0, 4) });
  return multiEstate ? `${crop} · ${estateName}` : crop;
}

/** All grower parcels (API + nested on estate), with offline cache fallback. */
export async function loadGrowerParcelRows(options: {
  approvedOnly?: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}): Promise<GrowerParcelRow[]> {
  const { approvedOnly = false, t } = options;
  let estates: Estate[] = [];
  try {
    estates = await estatesAPI.getAll();
    if (estates.length) await growerOfflineCache.saveEstates(estates);
  } catch {
    estates = (await growerOfflineCache.loadEstates()) ?? [];
  }

  const multiEstate = estates.length > 1;
  const rows: GrowerParcelRow[] = [];

  await Promise.all(
    (estates || []).map(async (estate) => {
      let parcels: Parcel[] = [];
      try {
        const fetched = await parcelsAPI.getByEstate(estate.id);
        const fromApi = Array.isArray(fetched) ? fetched : [];
        const fromNest = estate.parcels ?? [];
        parcels = mergeParcelsForEstate(fromApi, fromNest);
        if (parcels.length) await growerOfflineCache.saveParcels(estate.id, parcels);
      } catch {
        parcels = (await growerOfflineCache.loadParcels(estate.id)) ?? [];
      }

      for (const par of parcels) {
        if (approvedOnly && !par.approvedAt) continue;
        rows.push({
          id: par.id,
          cropType: par.cropType,
          approvedAt: par.approvedAt,
          status: par.status,
          estateId: estate.id,
          calculatedArea:
            typeof par.calculatedArea === 'number' ? par.calculatedArea : undefined,
          estateName: estate.name,
          label: displayLabel(par, estate.name, multiEstate, t),
        });
      }
    }),
  );

  return rows.sort((a, b) => a.label.localeCompare(b.label, 'sr'));
}
