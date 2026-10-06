import type { SeedOrigin } from '@biovera/shared/passport/seed-origin';
/** Public batch passport payload from GET /qr/verify/:batchId */

export type LinkageStatus = 'confirmed' | 'notRecorded';

export interface PassportSummary {
  productName: string;
  productDescription?: string | null;
  actualPackDate?: string | Date | null;
  variety: string | null;
  varietyLinkage: LinkageStatus;
  productPhotoUrl: string | null;
  photoLinkage: LinkageStatus;
  producerName: string;
  regionLabel: string;
  productionCountry: string | null;
  actualHarvestDate: string | Date | null;
  harvestDateLinkage: LinkageStatus;
  lot: { batchId: string; totalQuantity: number; unit: string };
  identifiedPackaging: {
    badgeSerial: string;
    badgeType: string;
    linkage: LinkageStatus;
  } | null;
  storage: {
    productStorageConditions: string | null;
    productStorageLinkage: LinkageStatus;
    platformStandard: {
      minC: number;
      maxC: number;
      source: string;
      label: string;
    } | null;
    declaredShelfLifeHours: number | null;
    declaredExpiresAt: string | Date | null;
    freshnessEstimate: {
      remainingHours: number | null;
      estimatedExpiresAt: string | Date | null;
      modelShelfLifeHours: number | null;
      source: string;
    } | null;
  };
}

export interface PassportWarning {
  code: string;
  severity: 'warning' | 'critical';
  messageKey: string;
}

export interface LotPackagingFormat {
  label: string | null;
  packSizeKg: number | null;
  scope: 'lot_orders';
}

export interface BatchPassportApi {
  originCandidate?: import('@biovera/shared/passport/origin-candidate').OriginCandidate | null;
  productionHistory?: import('@biovera/shared/passport/production-history').ProductionEvent[];
  historyGaps?: string[];
  qrId?: string;
  summary?: PassportSummary;
  warnings?: PassportWarning[];
  lotPackagingFormats?: LotPackagingFormat[];
  passportDocuments?: Array<{
    id: string;
    title: string;
    docType: string;
    scope: string;
    issuer: string | null;
    issuedAt: string | Date | null;
    expiresAt: string | Date | null;
    verificationStatus: string;
    url: string;
  }>;
  packingRecords?: Array<{
    packLabel: string | null;
    packSizeKg: number | null;
    packedPackCount: number | null;
    packedKg: number | null;
    packedAt: string | Date | null;
    packagingType: string | null;
    declaredShelfLifeHours: number | null;
    declaredExpiresAt: string | Date | null;
  }>;
  batch: {
    batchId: string;
    estateId?: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string | Date;
    status?: string;
    isCompromised?: boolean;
  };
  origin: {
    farmName: string;
    regionLabel?: string;
    productionCountry?: string | null;
    harvestLocation?: string;
    estateCalculatedAreaHa?: number;
    parcelCalculatedAreaHa?: number | null;
  };
  farmer: { name: string; photo?: string | null };
  photos?: { url: string; type: string; verified: boolean }[];
  timeline: {
    harvested: string | Date;
    verified?: string | Date | null;
    loaded?: string | Date | null;
    arrived?: string | Date | null;
  };
  coldChainProof?: {
    hasReadings?: boolean;
    continuousControlConfirmed?: boolean;
    readingsWithinCriteria?: boolean | null;
    readingsCount?: number;
    evaluationCriteria?: string | null;
    minTemp?: number | null;
    maxTemp?: number | null;
    avgTemp?: number | null;
    temperatureData?: Array<{
      timestamp: string | Date;
      temperature: number;
      location?: string;
      phase?: string;
    }>;
  };
  freshness?: {
    estimate?: PassportSummary['storage']['freshnessEstimate'];
    timestampHarvested?: string | Date | null;
    isExpired?: boolean;
  } | null;
  missions?: Array<{
    missionNumber?: string;
    status?: string;
    pickedUpAt?: string | Date | null;
    deliveredAt?: string | Date | null;
    logisticsHandover?: { insideTruckTemperature: number; timestamp: string | Date } | null;
  }>;
  protocol360?: {
    overallStatus?: string;
    levels?: Array<{ level: number; name: string; status: string; badgeText?: string }>;
  } | null;
  parcelInfo?: {
    cropType: string | null;
    plantingDate: string | Date | null;
    expectedHarvestDate: string | Date | null;
    calculatedAreaHa?: number;
  } | null;
  fieldWork?: Array<{
    type: string;
    occurredAt: string | Date;
    materialName?: string | null;
    materialQuantity?: number | null;
    materialUnit?: string | null;
    notes?: string | null;
  }>;
  treatments?: Array<{
    productName: string;
    dosage: string;
    appliedAt: string | Date;
  }>;
  growthLogs?: Array<{
    networkTimestamp: string | Date;
    growthStage?: string | null;
    notes?: string | null;
    imageUrl?: string | null;
    labResultUrl?: string | null;
    labTestDate?: string | Date | null;
  }>;
  seedOrigin?: SeedOrigin[];
  materialScans?: Array<{ scannedBarcode: string; networkTimestamp: string | Date }>;
  qualityEntry?: {
    weatherAtHarvestSummary?: string | null;
    notes?: string | null;
    status?: string;
    preCoolingStartTime?: string | Date;
  } | null;
  packageBadges?: Array<{ serial: string; type: string }>;
}
