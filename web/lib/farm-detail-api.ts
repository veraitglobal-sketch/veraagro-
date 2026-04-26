/**
 * Farm Detail API – aggregate farmer data for admin view
 * Single farmer overview: field photos, lab results, Sedex status
 * Prefers GET /admin/farmers/:farmerId (or /admin/farm/:farmerId — same payload); falls back if needed
 */

const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3004';

export interface FarmDetailData {
  farmer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    partnerCode?: string;
    phone?: string;
    roles?: string[];
    status?: string;
  };
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
    status?: string;
  }>;
}

/**
 * Fetch farm detail – tries dedicated endpoint first, falls back to multiple calls
 */
export async function getFarmDetail(farmerId: string): Promise<FarmDetailData> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    let res = await fetch(`${base}/admin/farmers/${farmerId}`, { headers });
    if (!res.ok) {
      res = await fetch(`${base}/admin/farm/${farmerId}`, { headers });
    }
    if (res.ok) {
      return res.json();
    }
  } catch (_) {
    // Fall through to aggregate
  }

  return aggregateFarmDetail(farmerId);
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
    farmer,
    estates: estatesWithParcels,
    fieldPhotos: [],
    compliancePhotos: [],
    labResults: [],
    sedexStatus: undefined,
    treatmentLogs: [],
    harvestAnnouncements: [],
    batches: [],
  };
}
