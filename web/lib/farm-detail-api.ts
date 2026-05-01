/**
 * Farm Detail API – aggregate farmer data for admin view
 * GET /admin/farmers/:id (optional ?include=) — fallback GET /admin/farm/:id
 */

import { WEB_API_BASE } from './api-base';

const base = WEB_API_BASE;

export interface FarmerProfileBlock {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  partnerCode?: string | null;
  phone?: string | null;
  roles?: string[];
  status?: string;
}

export interface FarmDetailCounts {
  estates: number;
  parcels: number;
  batches: number;
  treatmentLogs: number;
  complianceLogs: number;
  growthLogs: number;
  missions: number;
}

export interface TrustRow {
  currentScore: number;
  farmerScore: number | null;
  averageRating: number;
  totalRatings: number;
  lastUpdated: string;
}

export interface KycDocRow {
  id: string;
  docType: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

export interface MaterialBalanceRow {
  crateBalance: number;
  labelRollBalance: number;
  filmMeterBalance: number;
  lastUpdated: string;
}

export interface ComplianceLogListItem {
  id: string;
  estateId: string;
  parcelId: string | null;
  entryType: string;
  isCompliant: boolean;
  complianceStatus: string;
  createdAt: string;
}

export interface FarmDetailData {
  meta?: { schemaVersion: number; generatedAt: string };
  farmer: FarmerProfileBlock;
  materialBalance?: MaterialBalanceRow | null;
  trust?: TrustRow | null;
  kycDocuments?: KycDocRow[];
  counts?: FarmDetailCounts;
  estates: Array<{
    id: string;
    name: string;
    calculatedArea?: number;
    status?: string;
    parcels?: Array<{
      id: string;
      cropType?: string;
      calculatedArea?: number;
    }>;
  }>;
  fieldPhotos: Array<{
    id: string;
    imageUrl: string;
    imageHash?: string;
    createdAt?: string;
    growthStage?: string;
  }>;
  compliancePhotos: Array<{
    id: string;
    photoUrl: string;
    photoType?: string;
    batchId?: string;
  }>;
  labResults: Array<{
    id?: string;
    labResultUrl?: string;
    labTestDate?: string;
    source?: string;
  }>;
  sedexStatus?: {
    status: 'PASS' | 'PENDING' | 'FAIL' | 'NOT_APPLICABLE';
    lastChecked?: string;
    notes?: string;
  };
  treatmentLogs?: Array<{
    id: string;
    productName: string;
    appliedAt: string;
    parcelId?: string;
  }>;
  harvestAnnouncements?: Array<{
    id: string;
    cropType: string;
    estimatedDate: string;
    status?: string;
  }>;
  batches?: Array<{
    id: string;
    batchId: string;
    productName: string;
    quantity: number;
    unit?: string;
    status?: string;
    harvestDate?: string;
  }>;
  complianceLogs?: ComplianceLogListItem[];
}

const EMPTY: Omit<FarmDetailData, 'farmer'> = {
  estates: [],
  fieldPhotos: [],
  compliancePhotos: [],
  labResults: [],
  treatmentLogs: [],
  harvestAnnouncements: [],
  batches: [],
  complianceLogs: [],
};

const INCLUDE_SUMMARY =
  'meta,farmer,counts,materialBalance,trust,kycDocuments,estates,complianceLogs';
const INCLUDE_GALLERY =
  'batches,compliancePhotos,treatmentLogs,fieldPhotos,growthLogs,labResults,harvestAnnouncements,missions,batchesSummary';

/**
 * Single fetch: full dossier, or a subset with `?include=`
 */
export async function getFarmDetail(
  farmerId: string,
  options?: { include?: string }
): Promise<FarmDetailData> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const q = options?.include
    ? `?include=${encodeURIComponent(options.include)}`
    : '';

  try {
    let res = await fetch(`${base}/admin/farmers/${encodeURIComponent(farmerId)}${q}`, { headers });
    if (!res.ok) {
      res = await fetch(`${base}/admin/farm/${encodeURIComponent(farmerId)}${q}`, { headers });
    }
    if (res.ok) {
      return normalizeAdminFarmerResponse(await res.json());
    }
  } catch {
    // Fall through
  }

  return aggregateFarmDetail(farmerId);
}

/**
 * Two parallel calls: smaller first paint (summary + compliance) and gallery/trace rest.
 */
export async function getFarmDetailSplit(farmerId: string): Promise<FarmDetailData> {
  const [head, tail] = await Promise.all([
    getFarmDetail(farmerId, { include: INCLUDE_SUMMARY }),
    getFarmDetail(farmerId, { include: INCLUDE_GALLERY }),
  ]);
  return {
    ...EMPTY,
    ...head,
    ...tail,
    farmer: head.farmer?.id ? head.farmer : tail.farmer,
    estates: (head.estates?.length ? head.estates : tail.estates) ?? [],
    meta: head.meta ?? tail.meta,
  };
}

function normalizeAdminFarmerResponse(json: any): FarmDetailData {
  const f = json.farmer;
  if (!f) {
    return {
      ...EMPTY,
      farmer: { id: '', firstName: '', lastName: '' },
    };
  }
  return {
    meta: json.meta,
    farmer: {
      id: f.id,
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      partnerCode: f.partnerCode,
      phone: f.phone,
      roles: f.roles,
      status: f.status,
    },
    materialBalance: json.materialBalance,
    trust: json.trust,
    kycDocuments: json.kycDocuments ?? [],
    counts: json.counts,
    estates: Array.isArray(json.estates) ? json.estates : [],
    fieldPhotos: Array.isArray(json.fieldPhotos) ? json.fieldPhotos : [],
    compliancePhotos: Array.isArray(json.compliancePhotos) ? json.compliancePhotos : [],
    labResults: Array.isArray(json.labResults) ? json.labResults : [],
    treatmentLogs: Array.isArray(json.treatmentLogs) ? json.treatmentLogs : [],
    harvestAnnouncements: Array.isArray(json.harvestAnnouncements) ? json.harvestAnnouncements : [],
    batches: Array.isArray(json.batches)
      ? json.batches.map((b: any) => ({
          id: b.id,
          batchId: b.batchId,
          productName: b.productName,
          quantity: b.quantity,
          unit: b.unit,
          status: b.status,
          harvestDate: typeof b.harvestDate === 'string' ? b.harvestDate : b.harvestDate?.toISOString?.(),
        }))
      : Array.isArray(json.batchesSummary)
        ? json.batchesSummary.map((b: any) => ({
            id: b.id,
            batchId: b.batchId,
            productName: b.productName,
            quantity: b.quantity,
            status: b.status,
          }))
        : [],
    complianceLogs: Array.isArray(json.complianceLogs) ? mapComplianceForUi(json.complianceLogs) : [],
  };
}

function mapComplianceForUi(logs: any[]): ComplianceLogListItem[] {
  return logs.map((c) => ({
    id: c.id,
    estateId: c.estateId,
    parcelId: c.parcelId,
    entryType: c.entryType,
    isCompliant: c.isCompliant,
    complianceStatus: c.complianceStatus,
    createdAt: c.createdAt,
  }));
}

async function aggregateFarmDetail(farmerId: string): Promise<FarmDetailData> {
  const { usersAPI, estatesAPI, parcelsAPI } = await import('./api');

  const [userRes, estatesRes] = await Promise.all([
    usersAPI.getOne(farmerId).catch(() => null),
    estatesAPI.getAll().catch(() => []),
  ]);

  const farmer = userRes
    ? {
        id: userRes.id,
        firstName: userRes.firstName ?? '',
        lastName: userRes.lastName ?? '',
        email: userRes.email,
        partnerCode: userRes.partnerCode,
        phone: userRes.phone,
        roles: userRes.roles,
        status: userRes.status,
      }
    : {
        id: farmerId,
        firstName: '',
        lastName: '',
      };

  const allEstates = Array.isArray(estatesRes) ? estatesRes : [];
  const estates = allEstates.filter((e: any) => e.ownerId === farmerId || e.owner?.id === farmerId);
  const estatesWithParcels = await Promise.all(
    (estates.length ? estates : allEstates).slice(0, 10).map(async (e: any) => {
      try {
        const parcels = await parcelsAPI.getByEstate(e.id);
        return { ...e, parcels: parcels ?? [] };
      } catch {
        return { ...e, parcels: [] };
      }
    })
  );

  return {
    ...EMPTY,
    farmer,
    estates: estatesWithParcels,
  };
}
