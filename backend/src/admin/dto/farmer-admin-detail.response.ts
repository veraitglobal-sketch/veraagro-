/**
 * Response shape for GET /admin/farmers/:id (and GET /admin/farm/:id).
 * Maps Prisma models: users, estates, parcels, batches, compliance_photos, treatment_logs,
 * compliance_logs, growth_logs, harvest_announcements, quality_entries, missions (grower),
 * farmer_material_balances, trust_scores, kyc_documents.
 */

export interface FarmerProfileBlock {
  /** users */
  id: string;
  partnerCode: string;
  email: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  roles: string[];
  status: string;
  farmerQrCode: string | null;
  farmerProfileUrl: string | null;
  farmerPhoto: string | null;
  farmerBio: string | null;
  productionCountry: string | null;
  yearsOfExperience: number | null;
  generation: string | null;
  isVeraPartner: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  updatedAt: string;
}

export interface EstateAdminRow {
  /** estates + nested parcels */
  id: string;
  name: string;
  status: string;
  polygonCoordinates: unknown;
  calculatedArea: number;
  verifiedArea: number | null;
  estateQrCode: string | null;
  certificationStartDate: string | null;
  daysRemaining: number | null;
  createdAt: string;
  updatedAt: string;
  parcels: ParcelAdminRow[];
}

export interface ParcelAdminRow {
  /** parcels */
  id: string;
  estateId: string;
  cropType: string | null;
  calculatedArea: number;
  status: string;
  validationError: string | null;
  inputSerialNumber: string | null;
  plantingDate: string | null;
  expectedHarvestDate: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchAdminRow {
  /** batches + relations */
  id: string;
  batchId: string;
  estateId: string;
  estateName: string | null;
  parcelId: string | null;
  parcelCropType: string | null;
  productName: string;
  quantity: number;
  unit: string;
  harvestDate: string;
  status: string;
  harvestedByUserId: string | null;
  currentHubId: string | null;
  createdAt: string;
  updatedAt: string;
  compliance_photos: CompliancePhotoRow[];
  qualityEntry: QualityEntryRow | null;
}

export interface CompliancePhotoRow {
  /** compliance_photos */
  id: string;
  batchId: string;
  photoType: string;
  photoUrl: string;
  isVerified: boolean;
  uploadedAt: string;
  uploadedBy: string;
}

export interface QualityEntryRow {
  /** quality_entries (1:1 optional on batch) */
  id: string;
  status: string;
  preCoolingStartTime: string;
  standardConfirmation: boolean;
  createdAt: string;
}

export interface TreatmentLogRow {
  /** treatment_logs (via grower’s parcels) */
  id: string;
  parcelId: string;
  productId: string;
  productName: string;
  dosage: string;
  waterVolume: number | null;
  reason: string | null;
  appliedAt: string;
  gpsLatitude: number;
  gpsLongitude: number;
  gpsAccuracy: number | null;
  deviceTimestamp: string;
  needsAudit: boolean;
  createdAt: string;
}

export interface ComplianceLogRow {
  /** compliance_logs (seed/packaging scans, field diary) */
  id: string;
  estateId: string;
  parcelId: string | null;
  entryType: string;
  isCompliant: boolean;
  complianceStatus: string;
  blockedReason: string | null;
  gpsLatitude: number;
  gpsLongitude: number;
  isWithinFarm: boolean;
  deviceTimestamp: string;
  createdAt: string;
}

export interface GrowthLogRow {
  /** growth_logs */
  id: string;
  estateId: string;
  parcelId: string | null;
  imageUrl: string;
  growthStage: string | null;
  networkTimestamp: string;
  deviceTimestamp: string;
  createdAt: string;
  labResultUrl: string | null;
  labTestDate: string | null;
}

export interface HarvestAnnouncementRow {
  /** harvest_announcements */
  id: string;
  parcelId: string;
  announcementType: string;
  cropType: string;
  estimatedDate: string;
  estimatedQuantity: number | null;
  status: string;
  marketChannel: string | null;
  qualityGrade: string | null;
  adminNotes: string | null;
  createdAt: string;
}

export interface MissionGrowerRow {
  /** missions (growerId = farmer) */
  id: string;
  missionNumber: string;
  status: string;
  batchId: string | null;
  pickupAddress: string;
  createdAt: string;
}

export interface MaterialBalanceRow {
  /** farmer_material_balances */
  crateBalance: number;
  labelRollBalance: number;
  filmMeterBalance: number;
  lastUpdated: string;
}

export interface TrustRow {
  /** trust_scores */
  currentScore: number;
  farmerScore: number | null;
  averageRating: number;
  totalRatings: number;
  lastUpdated: string;
}

export interface KycDocRow {
  /** kyc_documents (no fileUrl in admin list — optional flag) */
  id: string;
  docType: string;
  status: string;
  createdAt: string;
  verifiedAt: string | null;
}

export interface FarmerAdminDetailResponse {
  meta: { schemaVersion: 1; generatedAt: string };
  farmer: FarmerProfileBlock;
  materialBalance: MaterialBalanceRow | null;
  trust: TrustRow | null;
  kycDocuments: KycDocRow[];
  estates: EstateAdminRow[];
  /** All batches on grower’s estates, with compliance_photos + quality_entries */
  batches: BatchAdminRow[];
  /**
   * Denormalized from `batches[].compliance_photos` for list UIs
   * (same idea as previous GET /admin/farm/:id).
   */
  compliancePhotos: { id: string; photoUrl: string; photoType: string; batchId: string }[];
  treatmentLogs: TreatmentLogRow[];
  /** compliance_logs: seed/packaging scans, offline field diary (farmerId) */
  complianceLogs: ComplianceLogRow[];
  /** Subset of growth_logs for gallery thumbnails */
  fieldPhotos: { id: string; imageUrl: string; imageHash: string; createdAt: string; growthStage?: string }[];
  growthLogs: GrowthLogRow[];
  labResults: { id: string; labResultUrl: string; labTestDate: string | undefined; source: 'growth_log' }[];
  harvestAnnouncements: HarvestAnnouncementRow[];
  missions: MissionGrowerRow[];
  /**
   * Legacy slim batch list (optional consumers)
   * @deprecated Prefer `batches`
   */
  batchesSummary: { id: string; batchId: string; productName: string; quantity: number; status: string }[];
  counts: {
    estates: number;
    parcels: number;
    batches: number;
    treatmentLogs: number;
    complianceLogs: number;
    growthLogs: number;
    missions: number;
  };
}
