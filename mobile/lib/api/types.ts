export interface CatalogPackOption {
  id: string;
  label: string;
  packSizeKg: number;
  pricePerPack: number;
  pricePerKg: number;
  maxPacks: number;
}

export interface Product {
  id: string;
  batchId?: string;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate?: string;
  catalogProduct?: boolean;
  availableKg?: number;
  availableUntil?: string | null;
  packOptions?: CatalogPackOption[];
  category?: string | null;
  selectedPackOptionId?: string;
  pricePerPack?: number;
  estate: {
    id: string;
    name: string;
    location?: string;
    owner?: {
      firstName: string;
      lastName: string;
    };
  };
  parcel?: {
    id: string;
    cropType: string;
  };
  price?: number;
  rating?: number;
  daysInConversion?: number;
  hasDigitalPassport?: boolean;
}

export interface Estate {
  id: string;
  name: string;
  location?: string;
  status: string;
  certificationStartDate?: string;
  daysRemaining?: number;
  calculatedArea: number;
  parcels?: Parcel[];
  polygonCoordinates?: Array<{ lat: number; lng: number }>;
  owner?: {
    firstName: string;
    lastName: string;
    partnerCode: string;
  };
}

export interface Parcel {
  id: string;
  cropType: string;
  calculatedArea: number;
  plantingDate?: string;
  status: string;
  /** Set when an administrator has approved the parcel; required for batches and entry log sync */
  approvedAt?: string | null;
  polygonCoordinates?: unknown;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface AiAssistantResponse {
  answer: string;
  suggestedActions?: Array<{ label: string; url: string }>;
  quickActions?: Array<{ label: string; query: string }>;
  askForContact?: boolean;
  sessionId: string;
}


export interface CreateHarvestPlanBody {
  sourcePlantingId?: string;
  parcelId: string;
  announcementType: 'HARVEST' | 'PLANTING';
  cropType: string;
  estimatedDate: string;
  estimatedQuantity?: number;
  plannedLoadingStart?: string;
  plannedLoadingEnd?: string;
  loadQuantityKg?: number;
  marketChannel?: string;
  qualityGrade?: string;
  sortingSpec?: string;
  notes?: string;
}


export interface RetailLocation {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  latitude: number;
  longitude: number;
  type: string;
  status?: string;
  /** Merged map: retail from distributors / hubs */
  kind?: 'retail' | 'supplier';
  /** B2B material supplier (seeds, inputs) — same as `id` for API calls */
  supplierUserId?: string;
  description?: string;
  bioVeraSeedInStock?: Array<{ approvedProductId: string; name: string; bags: number }>;
}


export interface FieldEntry {
  id: string;
  type: string;
  farmId: string;
  parcelId?: string | null;
  plantingId?: string | null;
  seedSerialNumber?: string | null;
  materialName?: string | null;
  materialQuantity?: number | null;
  materialUnit?: string | null;
  areaHa?: number | null;
  clientReference?: string | null;
  occurredAt?: string;
  data: {
    date: string;
    location?: { lat: number; lng: number };
    notes?: string;
    bags?: Array<{ serial: string; quantityKg?: number }>;
    lot?: string;
    parcelId?: string;
    areaHa?: number;
    materialName?: string;
    materialQuantity?: number;
    photos?: string[];
    [key: string]: unknown;
  };
  createdAt: string;
}


export interface GrowthLog {
  id: string;
  estateId: string;
  parcelId?: string;
  harvestAnnouncementId?: string | null;
  imageUrl: string;
  gpsLatitude: number;
  gpsLongitude: number;
  notes?: string;
  growthStage?: string;
  createdAt: string;
  deviceTimestamp?: string;
  parcel?: {
    id: string;
    cropType: string;
  };
  plan?: {
    id: string;
    cropType: string;
    announcementType: string;
    estimatedDate: string;
    status: string;
  };
}



export type GrowerPaymentSummary =
  | 'AWAITING_PAYMENT'
  | 'PAID_IN_ESCROW'
  | 'SETTLED'
  | 'REFUNDED'
  | 'CANCELLED'
  | 'UNKNOWN';

export interface Order {
  deliveries?: {
    id: string;
    deliveryNumber: string;
    status: string;
    buyerPickupConfirmedAt?: string | null;
    confirmedAt?: string | null;
    users?: { firstName?: string; lastName?: string; companyName?: string; phone?: string };
  } | null;
  clientRequestId?: string | null;
  checkoutReplay?: boolean;
  stockReservation?: { status: string; quantity: number; unit: string } | null;
  payments?: { status: string; paymentMethod?: string } | null;
  invoices?: { id: string; invoiceNumber: string } | null;
  shipmentTracking?: { missionNumber: string | null; missionStatus: string | null; events: Array<{ code: string; at: string }> };
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  status: string;
  /** Grower-safe payment summary from GET /orders/grower — no buyer payment records. */
  growerPaymentSummary?: GrowerPaymentSummary;
  deliveryAddress: any;
  deliveryNotes?: string;
  packLabel?: string | null;
  packSizeKg?: number | null;
  packCount?: number | null;
  /** Grower view (GET /orders/grower): packing state and next step. */
  packLine?: string;
  packedPackCount?: number | null;
  packedKg?: number | null;
  packedAt?: string | null;
  nextAction?: 'PREPARE_AND_PACK' | 'SELECT_LOT' | 'REQUEST_PICKUP' | 'AWAITING_PICKUP' | 'IN_FULFILLMENT';
  packedBatchId?: string | null;
  packed_batch?: { id: string; batchId: string; productName: string; status: string } | null;
  deliveryCity?: string;
  missions?: Array<{ id: string; status: string; missionNumber: string }>;
  rejectionReason?: string | null;
  catalogProduct?: { id: string; name: string } | null;
  catalogProductId?: string | null;
  catalogReserved?: boolean;
  catalogReservedKg?: number | null;
  createdAt: string;
  updatedAt: string;
}


export interface ProductPassport {
  qrId?: string;
  batch: {
    batchId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: string;
    status?: string;
    isCompromised?: boolean;
  };
  origin: {
    farmName: string;
    regionLabel?: string;
    productionCountry?: string | null;
    harvestLocation?: string;
    harvestRegion?: string;
    harvestPeriod?: string | null;
    estateCalculatedAreaHa?: number;
    parcelCalculatedAreaHa?: number | null;
    estateMapCenter?: { lat: number; lng: number } | null;
    parcelMapCenter?: { lat: number; lng: number } | null;
  };
  farmer: {
    name: string;
    photo?: string | null;
    farmerProfileUrl?: string | null;
  };
  /** High-level journey timestamps (same as backend timeline object) */
  timeline: {
    harvested: string;
    verified?: string | null;
    loaded?: string | null;
    arrived?: string | null;
  };
  treatments?: Array<{
    appliedAt: string;
    productName: string;
    dosage: string;
    waterVolume?: number | null;
    reason?: string | null;
    deviceTimestamp: string;
    gpsLatitude?: number;
    gpsLongitude?: number;
    gpsAccuracyM?: number | null;
  }>;
  missions?: Array<{
    id?: string;
    missionNumber?: string;
    status?: string;
    pickupAddress?: string;
    estimatedPickupTime?: string | null;
    assignedAt?: string | null;
    acceptedAt?: string | null;
    logisticsPartner?: { name: string } | null;
    vehicle?: {
      vehicleNumber?: string;
      licensePlate?: string;
      type?: string;
      make?: string;
      model?: string;
    };
    locationLogs?: Array<{
      timestamp: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      address: string | null;
    }>;
    borderWaits?: Array<{
      borderName: string | null;
      borderArrivalTime: string;
      borderExitTime: string;
      waitTimeMinutes: number;
    }>;
    pickedUpAt?: string | null;
    deliveredAt?: string | null;
  }>;
  coldChainProof?: {
    temperatureData?: Array<{ timestamp: string; temperature: number; location?: string }>;
    minTemp?: number | null;
    maxTemp?: number | null;
    avgTemp?: number | null;
  };
  sustainability?: { totalDistanceKm?: string };
  protocol360?: {
    overallStatus?: string;
    levels?: Array<{ level: number; name: string; status: string; badgeText?: string }>;
  };
}


export interface BatchAvailability {
  batchId: string;
  productName: string;
  totalQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reservedPercentage: number;
  unit: string;
  isSoldOut: boolean;
}


export interface QualityEntry {
  id: string;
  batchId: string;
  /** Aligned with Prisma `QualityEntryStatus` (backend) */
  status: 'DRAFT' | 'COMPLETED' | 'VERIFIED' | 'REJECTED';
  qualityScore?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  batch?: any;
}


export type LogisticsDriverRow = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
};


export type LogisticsVehicleRow = {
  id: string;
  vehicleNumber: string;
  type: string;
  make?: string | null;
  model?: string | null;
  licensePlate: string;
  hasFrigo: boolean;
  tempRangeMin?: number;
  tempRangeMax?: number;
  status: string;
};


export type PackageBadgeType = 'PALLET_MASTER' | 'BOX_CHILD' | 'ROLL_LINE';


export type MissionAssignedDriver = {
  id?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  email?: string | null;
  photoUrl?: string | null;
};


export type MissionVehicleInfo = {
  id?: string;
  vehicleNumber?: string;
  licensePlate?: string;
  make?: string | null;
  model?: string | null;
  type?: string;
};


export type MissionBatchRef = {
  id?: string;
  batchId?: string | null;
  productName?: string | null;
};

export interface Mission {
  delivery?: { id: string; status: string; deliveryNumber: string; digital_handovers?: { id: string; status: string } | null } | null;
  id: string;
  /** Human-readable, e.g. MISSION-2026-0001-AB12 */
  missionNumber?: string;
  batchId?: string | null;
  status: string;
  fromHubId?: string;
  toHubId?: string;
  driverId?: string;
  logisticsPartnerId?: string | null;
  assignedLogisticsDriverId?: string | null;
  vehicleId?: string | null;
  logisticsPartnerLabel?: string | null;
  hasAssignedPickupDriver?: boolean;
  createdAt: string;
  updatedAt: string;
  batch?: MissionBatchRef | null;
  /** Mapped for grower API responses */
  assignedDriver?: MissionAssignedDriver | null;
  vehicleInfo?: MissionVehicleInfo | null;
  logisticsCompanyContact?: { firstName?: string; lastName?: string; phone?: string | null } | null;
  assigned_logistics_driver?: MissionAssignedDriver | null;
  vehicles?: MissionVehicleInfo | null;
  driver?: MissionAssignedDriver | null;
}


export interface FinancialDashboardApiResponse {
  dashboardRole?: 'PLATFORM' | 'GROWER';
  summary?: {
    farmerOrderShareTotal?: number;
    farmerShareReleased?: number;
    farmerShareInEscrow?: number;
    farmerSharePending?: number;
    estimatedVeraBonusDeliveredLots?: number;
    veraBonusPaid?: number;
    totalProfit?: number;
    seedMargin?: number;
    [key: string]: unknown;
  };
  monthly?: { totalBatches?: number; totalQuantity?: number; period?: string };
  yearly?: { totalBatches?: number; totalQuantity?: number; period?: string };
}


export interface Notification {
  id: string;
  type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  /** Set by client from API `read` or Prisma `status === 'READ'`. */
  read: boolean;
  createdAt: string;
  /** Present when API returns Prisma row as-is. */
  status?: 'UNREAD' | 'READ';
}



export interface RequiredCertification {
  id: string;
  title: string;
  description?: string;
}


export interface DigitalHandover {
  revision?: number;
  id: string;
  deliveryId: string;
  driverId: string;
  storeQrCode: string;
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED';
  qualityStatus?: 'FRESH' | 'DAMAGED';
  temperature?: number;
  photoUrls: string[];
  signature?: string;
  notes?: string;
  completedBy?: string;
  completedAt?: string;
  initiatedAt: string;
}

// Compliance Photos API (legacy estate uploads — prefer materialControlAPI + batch)

export interface CompliancePhoto {
  id: string;
  estateId: string;
  parcelId?: string;
  photoUrl: string;
  gpsLocation: { lat: number; lng: number };
  type: string;
  notes?: string;
  createdAt: string;
  estate?: Estate;
  parcel?: Parcel;
}

/** Label roll row from /material-control/my-label-rolls */

export interface LabelRollRow {
  serialNumber: string;
  status: string;
  soldAt: string | null;
  productName: string;
  source?: 'inventory' | 'package_badge';
}

/** GET /material-control/compliance-status/:batchId */

export interface ComplianceBatchStatus {
  publicBatchId: string;
  complete: boolean;
  requiredPhotoTypes: string[];
  uploadedPhotoTypes: string[];
  missingPhotoTypes: string[];
  stickerRollId: string | null;
  stickerStatus: string | null;
  lastComplianceAt: string | null;
}


export interface Material {
  id: string;
  barcode: string;
  name?: string;
  productName?: string;
  type?: 'FERTILIZER' | 'PESTICIDE' | 'SEED' | 'OTHER';
  manufacturer?: string;
  certification?: string;
  phiDays?: number; // Pre-Harvest Interval (days)
  mrlLimit?: number;
}

// KYC API (Pillar 1)

export interface TreatmentLog {
  id: string;
  parcelId: string;
  productId: string;
  productName: string;
  dosage: string;
  appliedAt: string;
  gpsLatitude: number;
  gpsLongitude: number;
  needsAudit?: boolean;
}


export interface PlotBlueprintZone {
  id: string;
  name: string;
  coordinates: { x1: number; y1: number; x2: number; y2: number };
  area: number;
  cropType?: string;
  plantingDate?: string;
  status?: string;
}


export interface PlotBlueprintPartition {
  id: string;
  type: 'HORIZONTAL' | 'VERTICAL';
  position: number;
}


export interface PlotBlueprint {
  parcelId: string;
  length: number;
  width: number;
  blueprintData: {
    zones: PlotBlueprintZone[];
    partitions: PlotBlueprintPartition[];
  };
}

export interface FarmerProfileMeResponse {
  farmer: {
    id: string;
    firstName: string;
    lastName: string;
    photo?: string | null;
    bio?: string | null;
    generation?: string | null;
    yearsOfExperience?: number | null;
    isVeraPartner?: boolean;
    partnerCode?: string | null;
  };
  farmerQrCode?: string;
  farmerProfileUrl?: string;
}
