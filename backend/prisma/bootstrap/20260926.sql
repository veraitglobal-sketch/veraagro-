-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'ESTATE_CREATED', 'ESTATE_VERIFIED', 'SEED_ASSIGNED', 'PARCEL_LOCKED', 'PARCEL_UNLOCKED', 'DATA_EXPORTED', 'CERTIFICATE_GENERATED');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('TEMPERATURE_CHANGE', 'LOCATION_CHANGE', 'STATUS_CHANGE', 'QUALITY_CHECK', 'BATCH_LOCKED', 'BATCH_UNLOCKED', 'PAYMENT_RELEASED', 'PRICE_UPDATED', 'QUALITY_ENTRY', 'LOGISTICS_HANDOVER');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PACKED', 'IN_HUB', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'EXPIRED', 'QUALITY_VERIFIED');

-- CreateEnum
CREATE TYPE "CropShelfLife" AS ENUM ('RASPBERRIES', 'BLACKBERRIES', 'BLUEBERRIES', 'APPLES', 'PEPPERS');

-- CreateEnum
CREATE TYPE "CropStatus" AS ENUM ('PREPARING_SOIL', 'YOUNG_SEEDLING', 'IN_FULL_PRODUCTION', 'HARVESTING', 'FALLOW');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "EstateStatus" AS ENUM ('ACTIVE', 'INVALID', 'PENDING_SETUP', 'CERTIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "HubStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'SOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('AVAILABLE', 'SOLD', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MaterialTypeEnum" AS ENUM ('CRATE', 'LABEL', 'FILM');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('AWAITING_APPROVAL', 'PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'READY_FOR_LOADING');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('DELIVERY_ASSIGNED', 'DRIVER_NEARBY', 'PACKAGE_READY', 'PAYMENT_RELEASED', 'QUALITY_ISSUE', 'BATCH_ARRIVED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACTION_REQUIRED', 'REMINDER', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('ACTIVE', 'INVALID', 'LOCKED', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('DRAFT', 'GENERATED', 'VERIFIED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'IN_ESCROW', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PriceTrend" AS ENUM ('UP', 'DOWN', 'STABLE');

-- CreateEnum
CREATE TYPE "QualityEntryStatus" AS ENUM ('DRAFT', 'COMPLETED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "QualityStatus" AS ENUM ('FRESH', 'DAMAGED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "SeedStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'SCANNED', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SeedType" AS ENUM ('SEED', 'FERTILIZER');

-- CreateEnum
CREATE TYPE "PartnerApplicationStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'CONTACTED', 'MEETING_SCHEDULED', 'NEGOTIATION', 'APPROVED', 'REJECTED', 'ONBOARDED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'PARTNER', 'ADMIN', 'DRIVER', 'BUYER', 'SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'LOGISTICS_PARTNER', 'MATERIAL_SUPPLIER', 'COMMERCIAL_AGENT');

-- CreateEnum
CREATE TYPE "SupplierDirectOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageBadgeType" AS ENUM ('PALLET_MASTER', 'BOX_CHILD', 'ROLL_LINE');

-- CreateEnum
CREATE TYPE "BadgePrintOrderStatus" AS ENUM ('DRAFT', 'SENT_TO_PRINTER', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PackageBadgeLifecycle" AS ENUM ('ACTIVE', 'RETURNED_TO_SUPPLIER');

-- CreateEnum
CREATE TYPE "SupplierMaterialBarcodeStatus" AS ENUM ('IN_STOCK', 'SOLD', 'VOID');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('EARNED', 'WITHDRAWN', 'REFUNDED', 'PENALTY', 'BONUS', 'PLATFORM_FEE');

-- CreateEnum
CREATE TYPE "DigitalHandoverStatus" AS ENUM ('INITIATED', 'IN_PROGRESS', 'COMPLETED', 'DISPUTED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "performedByUserId" TEXT,
    "performedByRole" "UserRole",
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_trails" (
    "id" TEXT NOT NULL,
    "eventType" "AuditEventType" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "batchId" TEXT,
    "performedByUserId" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB NOT NULL,
    "changeReason" TEXT,
    "location" JSONB,
    "temperature" DOUBLE PRECISION,
    "temperatureUnit" TEXT,
    "deviceId" TEXT,
    "deviceModel" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCompliant" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "audit_trails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batches" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelId" TEXT,
    "harvestedByUserId" TEXT,
    "currentHubId" TEXT,
    "transportedByDriverId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "harvestDate" TIMESTAMP(3) NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PACKED',
    "qualityIssues" JSONB,
    "inventoryId" TEXT,
    "locationHistory" JSONB NOT NULL,
    "blockchainTxHash" TEXT,
    "blockchainRegisteredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bio_vera_standards" (
    "id" TEXT NOT NULL,
    "requiredTemperatureMin" DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    "requiredTemperatureMax" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "requiredPackagingType" TEXT NOT NULL DEFAULT 'BIO_VERA_CRATE',
    "requiredFilmType" TEXT NOT NULL DEFAULT 'BIO_VERA_FILM',
    "requiresCompliancePhotos" BOOLEAN NOT NULL DEFAULT true,
    "requiredPhotoTypes" TEXT[] DEFAULT ARRAY['PUNNETS', 'LABELING', 'PALLETIZATION']::TEXT[],
    "qualityPremiumAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "crateCostPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "labelCostPerUnit" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "filmCostPerMeter" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bio_vera_standards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bio_white_list" (
    "id" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "materialType" TEXT NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "phiDays" INTEGER,
    "mrlLimit" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "addedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bio_white_list_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_logs" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "waterVolume" DOUBLE PRECISION,
    "reason" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL,
    "gpsLatitude" DOUBLE PRECISION NOT NULL,
    "gpsLongitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "deviceId" TEXT,
    "deviceTimestamp" TIMESTAMP(3) NOT NULL,
    "needsAudit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "treatment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "border_wait_times" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "borderName" TEXT,
    "borderArrivalTime" TIMESTAMP(3) NOT NULL,
    "borderExitTime" TIMESTAMP(3) NOT NULL,
    "waitTimeMinutes" INTEGER NOT NULL,
    "notes" TEXT,
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "border_wait_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_logs" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelId" TEXT,
    "entryType" TEXT NOT NULL,
    "scannedBarcode" TEXT NOT NULL,
    "barcodeType" TEXT NOT NULL,
    "isCompliant" BOOLEAN NOT NULL,
    "complianceStatus" TEXT NOT NULL,
    "blockedReason" TEXT,
    "gpsLatitude" DOUBLE PRECISION NOT NULL,
    "gpsLongitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "isWithinFarm" BOOLEAN NOT NULL,
    "photos" TEXT[],
    "deviceFingerprint" TEXT NOT NULL,
    "deviceId" TEXT,
    "deviceTimestamp" TIMESTAMP(3) NOT NULL,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "syncedAt" TIMESTAMP(3),
    "offlineId" TEXT,
    "relatedSeedInventoryId" TEXT,
    "relatedBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "networkTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compliance_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compliance_photos" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "photoType" TEXT NOT NULL,
    "photoUrl" TEXT NOT NULL,
    "photoHash" TEXT NOT NULL,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "compliance_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" TEXT NOT NULL,
    "deliveryNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "pickupLocation" JSONB NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "deliveryLocation" JSONB NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "deliveryQRCode" TEXT NOT NULL,
    "qrScannedAt" TIMESTAMP(3),
    "assignedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "inTransitAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "buyerPickupConfirmedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "pickupSignature" TEXT,
    "deliverySignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_delivery_issues" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "photoUrls" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buyer_delivery_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_passports" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelIds" TEXT[],
    "exportData" JSONB NOT NULL,
    "passportHash" TEXT NOT NULL,
    "signature" TEXT,
    "status" "PassportStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedByUserId" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),

    CONSTRAINT "digital_passports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_quota_usage" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "orderId" TEXT,
    "quantityUsed" DOUBLE PRECISION NOT NULL,
    "discountRate" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "maxQuotaPerHectare" DOUBLE PRECISION NOT NULL DEFAULT 200,
    "estateArea" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_quota_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distributor_arrivals" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "hubName" TEXT NOT NULL,
    "arrivalTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperatureAtArrival" DOUBLE PRECISION NOT NULL,
    "visualState" TEXT NOT NULL,
    "notes" TEXT,
    "photos" TEXT[],
    "recordedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distributor_arrivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "estateQrCode" TEXT,
    "polygonCoordinates" JSONB NOT NULL,
    "calculatedArea" DOUBLE PRECISION NOT NULL,
    "verifiedArea" DOUBLE PRECISION,
    "status" "EstateStatus" NOT NULL DEFAULT 'PENDING_SETUP',
    "certificationStartDate" TIMESTAMP(3),
    "daysRemaining" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "estates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_material_balances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "crateBalance" INTEGER NOT NULL DEFAULT 0,
    "labelRollBalance" INTEGER NOT NULL DEFAULT 0,
    "filmMeterBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPurchased" JSONB NOT NULL,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_material_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freshness_trackers" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "timestampHarvested" TIMESTAMP(3) NOT NULL,
    "shelfLifeHours" INTEGER NOT NULL,
    "remainingShelfLifeHours" DOUBLE PRECISION NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "alertSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "freshness_trackers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "growth_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imageHash" TEXT NOT NULL,
    "gpsLatitude" DOUBLE PRECISION NOT NULL,
    "gpsLongitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "deviceId" TEXT NOT NULL,
    "deviceModel" TEXT,
    "networkTimestamp" TIMESTAMP(3) NOT NULL,
    "deviceTimestamp" TIMESTAMP(3) NOT NULL,
    "timeOffset" INTEGER,
    "notes" TEXT,
    "growthStage" TEXT,
    "materialBarcode" TEXT,
    "materialKind" TEXT,
    "dataHash" TEXT NOT NULL,
    "previousLogHash" TEXT,
    "moderationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "rejectionReason" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "moderatedByUserId" TEXT,
    "labResultUrl" TEXT,
    "labResultHash" TEXT,
    "labTestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "harvestAnnouncementId" TEXT,

    CONSTRAINT "growth_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hubs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "status" "HubStatus" NOT NULL DEFAULT 'ACTIVE',
    "managerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "hubId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "parcelId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "estimatedDeliveryDays" INTEGER,
    "availableCities" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "deliveryId" TEXT,
    "pdfUrl" TEXT NOT NULL,
    "pdfHash" TEXT NOT NULL,
    "invoiceData" JSONB NOT NULL,
    "sentToEmail" TEXT,
    "sentAt" TIMESTAMP(3),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "location_logs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "vehicleId" TEXT,
    "batchId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "address" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "deviceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "location_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_handovers" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "insideTruckTemperature" DOUBLE PRECISION NOT NULL,
    "palletPhotos" JSONB,
    "truckInteriorPhotos" JSONB,
    "verifiedBy" TEXT NOT NULL,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING',
    "pickupDriverId" TEXT,
    "pickupDriverSnapshot" JSONB,
    "pickupBadgePhotoUrl" TEXT,
    "pickupDriverSignatureUrl" TEXT,
    "receiverName" TEXT,
    "receiverSignatureDataUrl" TEXT,
    "receiverSignedAt" TIMESTAMP(3),
    "receiverProofPdfHash" TEXT,

    CONSTRAINT "logistics_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_badges" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "parentId" TEXT,
    "type" "PackageBadgeType" NOT NULL,
    "ownerUserId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "batchId" TEXT,
    "farmerQrCode" TEXT,
    "lifecycle" "PackageBadgeLifecycle" NOT NULL DEFAULT 'ACTIVE',
    "printOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "package_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_print_orders" (
    "id" TEXT NOT NULL,
    "requesterUserId" TEXT NOT NULL,
    "printerSupplierId" TEXT,
    "parentCount" INTEGER NOT NULL,
    "childrenPerParent" INTEGER NOT NULL,
    "serialPrefix" TEXT NOT NULL DEFAULT 'PLT',
    "planJson" JSONB NOT NULL,
    "notesToPrinter" TEXT,
    "status" "BadgePrintOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "badge_print_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_prices" (
    "id" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "buyPrice" DOUBLE PRECISION NOT NULL,
    "sellPrice" DOUBLE PRECISION NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "setByUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_inventory" (
    "id" TEXT NOT NULL,
    "materialTypeId" TEXT NOT NULL,
    "serialNumber" TEXT,
    "batchNumber" TEXT,
    "status" "MaterialStatus" NOT NULL DEFAULT 'AVAILABLE',
    "soldToUserId" TEXT,
    "soldAt" TIMESTAMP(3),
    "usedInBatchId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MaterialTypeEnum" NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "missionNumber" TEXT NOT NULL,
    "growerId" TEXT NOT NULL,
    "batchId" TEXT,
    "harvestAnnouncementId" TEXT,
    "pickupLocation" JSONB NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "destinationAddress" TEXT,
    "destinationCity" TEXT,
    "loadInstructions" TEXT,
    "logisticsPartnerId" TEXT,
    "assignedLogisticsDriverId" TEXT,
    "vehicleId" TEXT,
    "optimalRoute" JSONB,
    "estimatedPickupTime" TIMESTAMP(3),
    "status" "MissionStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "pickedUpAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "orderId" TEXT,

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "trigger" "NotificationTrigger" NOT NULL,
    "userRole" "UserRole" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "conditions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_push_devices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "deviceId" TEXT,
    "appSurface" TEXT,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_push_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "inventoryId" TEXT,
    "batchId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "fulfillingEstateId" TEXT,
    "parcelId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "deliveryAddress" JSONB NOT NULL,
    "deliveryNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "polygonCoordinates" JSONB NOT NULL,
    "calculatedArea" DOUBLE PRECISION NOT NULL,
    "inputSerialNumber" TEXT,
    "seedId" TEXT,
    "status" "ParcelStatus" NOT NULL DEFAULT 'INVALID',
    "validationError" TEXT,
    "cropType" TEXT,
    "plantingDate" TIMESTAMP(3),
    "expectedHarvestDate" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "publicCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvest_announcements" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "announcementType" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "estimatedDate" TIMESTAMP(3) NOT NULL,
    "estimatedQuantity" DOUBLE PRECISION,
    "plannedLoadingStart" TIMESTAMP(3),
    "plannedLoadingEnd" TIMESTAMP(3),
    "loadQuantityKg" DOUBLE PRECISION,
    "marketChannel" TEXT,
    "qualityGrade" TEXT,
    "sortingSpec" TEXT,
    "adminNotes" TEXT,
    "actualDate" TIMESTAMP(3),
    "actualQuantity" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "notifiedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvest_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "farmerAmount" DOUBLE PRECISION NOT NULL,
    "driverAmount" DOUBLE PRECISION NOT NULL,
    "platformFee" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "escrowReleaseDate" TIMESTAMP(3),
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "splitDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "releasedAt" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_entries" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "weatherAtHarvest" JSONB NOT NULL,
    "preCoolingStartTime" TIMESTAMP(3) NOT NULL,
    "visualGradePhotos" TEXT[],
    "standardConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "qualityScore" DOUBLE PRECISION,
    "confirmedBy" TEXT NOT NULL,
    "status" "QualityEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedUserId" TEXT NOT NULL,
    "ratingType" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "punctuality" INTEGER,
    "productQuality" INTEGER,
    "communication" INTEGER,
    "comment" TEXT,
    "trustScoreImpact" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scraped_prices" (
    "id" TEXT NOT NULL,
    "retailer" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kg',
    "location" TEXT NOT NULL,
    "url" TEXT,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scraped_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_alerts" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "barcode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
    "entryType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "gpsLatitude" DOUBLE PRECISION,
    "gpsLongitude" DOUBLE PRECISION,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seed_scans" (
    "id" TEXT NOT NULL,
    "inputSerialNumber" TEXT NOT NULL,
    "seedId" TEXT,
    "scannedByUserId" TEXT NOT NULL,
    "gpsLatitude" DOUBLE PRECISION NOT NULL,
    "gpsLongitude" DOUBLE PRECISION NOT NULL,
    "gpsAccuracy" DOUBLE PRECISION,
    "deviceId" TEXT NOT NULL,
    "deviceModel" TEXT,
    "networkTimestamp" TIMESTAMP(3) NOT NULL,
    "deviceTimestamp" TIMESTAMP(3) NOT NULL,
    "timeOffset" INTEGER,
    "parcelId" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT false,
    "validationError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seed_scans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seeds" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "type" "SeedType" NOT NULL,
    "name" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "areaCoverage" DOUBLE PRECISION NOT NULL,
    "status" "SeedStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignedToUserId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "manufacturedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seeds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temperature_logs" (
    "id" TEXT NOT NULL,
    "missionId" TEXT,
    "vehicleId" TEXT,
    "batchId" TEXT,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION,
    "location" JSONB NOT NULL,
    "reportedByUserId" TEXT NOT NULL,
    "sensorId" TEXT,
    "deviceId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isOutOfRange" BOOLEAN NOT NULL DEFAULT false,
    "alertSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "temperature_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "marketPriceId" TEXT NOT NULL,
    "cropType" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "growerId" TEXT,
    "buyerId" TEXT,
    "orderId" TEXT,
    "batchId" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentScore" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "farmerScore" DOUBLE PRECISION,
    "driverScore" DOUBLE PRECISION,
    "totalRatings" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "badges" TEXT[],
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trust_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "companyPosition" TEXT,
    "buyerCompanyProfile" JSONB,
    "roles" "UserRole"[] DEFAULT ARRAY['FARMER']::"UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "passwordHash" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "isVeraPartner" BOOLEAN NOT NULL DEFAULT false,
    "farmerQrCode" TEXT,
    "farmerProfileUrl" TEXT,
    "farmerPhoto" TEXT,
    "farmerBio" TEXT,
    "productionCountry" TEXT,
    "yearsOfExperience" INTEGER,
    "generation" TEXT,
    "assignedAgentUserId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commercial_agent_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "officeName" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "location" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commercial_agent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_applications" (
    "id" TEXT NOT NULL,
    "referenceCode" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "pib" TEXT,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "productType" TEXT,
    "certifications" JSONB,
    "description" TEXT,
    "status" "PartnerApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "internalNotes" TEXT,
    "meetingAt" TIMESTAMP(3),
    "linkedUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_supplier_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "street" TEXT,
    "houseNumber" TEXT,
    "address" TEXT NOT NULL,
    "postalCode" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "location" JSONB NOT NULL,
    "mapApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_supplier_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_catalog_items" (
    "id" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unit',
    "listPrice" DOUBLE PRECISION,
    "sku" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_threads" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_thread_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_thread_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_direct_orders" (
    "id" TEXT NOT NULL,
    "threadId" TEXT,
    "farmerId" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "status" "SupplierDirectOrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "noteFromFarmer" TEXT,
    "noteFromSupplier" TEXT,
    "farmerReceivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_direct_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_material_barcodes" (
    "id" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "catalogItemId" TEXT,
    "barcode" TEXT NOT NULL,
    "status" "SupplierMaterialBarcodeStatus" NOT NULL DEFAULT 'IN_STOCK',
    "lotNumber" TEXT,
    "note" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "soldAt" TIMESTAMP(3),
    "soldToFarmerId" TEXT,
    "directOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_material_barcodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_drivers" (
    "id" TEXT NOT NULL,
    "logisticsPartnerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "photoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "logisticsPartnerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "make" TEXT,
    "model" TEXT,
    "licensePlate" TEXT NOT NULL,
    "hasFrigo" BOOLEAN NOT NULL DEFAULT true,
    "tempRangeMin" DOUBLE PRECISION NOT NULL,
    "tempRangeMax" DOUBLE PRECISION NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "currentLocation" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vera_insights" (
    "id" TEXT NOT NULL,
    "cropName" TEXT NOT NULL,
    "veraScore" INTEGER NOT NULL,
    "historicalDeficit" DOUBLE PRECISION,
    "whyText" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'MEDIUM',
    "priceTrend" "PriceTrend" NOT NULL DEFAULT 'STABLE',
    "seedId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vera_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "orderId" TEXT,
    "deliveryId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "availableBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "totalEarned" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "bankAccount" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waybills" (
    "id" TEXT NOT NULL,
    "waybillNumber" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "pdfHash" TEXT NOT NULL,
    "generatedData" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waybills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "digital_handovers" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "storeQrCode" TEXT NOT NULL,
    "status" "DigitalHandoverStatus" NOT NULL DEFAULT 'INITIATED',
    "qualityStatus" "QualityStatus",
    "temperature" DOUBLE PRECISION,
    "photoUrls" TEXT[],
    "signature" TEXT,
    "notes" TEXT,
    "completedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "digital_handovers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disputes" (
    "id" TEXT NOT NULL,
    "handoverId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "evidencePhotos" TEXT[],
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disputes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plot_blueprints" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "blueprintData" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plot_blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "messages" JSONB NOT NULL,
    "userInfo" JSONB,
    "contactRequested" BOOLEAN NOT NULL DEFAULT false,
    "contactInfo" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grower_mobile_ingest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clientReference" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grower_mobile_ingest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_performedByUserId_idx" ON "audit_logs"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_trails_entityType_entityId_idx" ON "audit_trails"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_trails_eventType_idx" ON "audit_trails"("eventType");

-- CreateIndex
CREATE INDEX "audit_trails_performedByUserId_idx" ON "audit_trails"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_trails_timestamp_idx" ON "audit_trails"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "batches_batchId_key" ON "batches"("batchId");

-- CreateIndex
CREATE INDEX "batches_batchId_idx" ON "batches"("batchId");

-- CreateIndex
CREATE INDEX "batches_currentHubId_idx" ON "batches"("currentHubId");

-- CreateIndex
CREATE INDEX "batches_estateId_idx" ON "batches"("estateId");

-- CreateIndex
CREATE INDEX "batches_status_idx" ON "batches"("status");

-- CreateIndex
CREATE INDEX "bio_vera_standards_isActive_idx" ON "bio_vera_standards"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "bio_white_list_barcode_key" ON "bio_white_list"("barcode");

-- CreateIndex
CREATE INDEX "bio_white_list_barcode_idx" ON "bio_white_list"("barcode");

-- CreateIndex
CREATE INDEX "bio_white_list_isActive_idx" ON "bio_white_list"("isActive");

-- CreateIndex
CREATE INDEX "bio_white_list_materialType_idx" ON "bio_white_list"("materialType");

-- CreateIndex
CREATE INDEX "kyc_documents_userId_idx" ON "kyc_documents"("userId");

-- CreateIndex
CREATE INDEX "kyc_documents_status_idx" ON "kyc_documents"("status");

-- CreateIndex
CREATE INDEX "treatment_logs_parcelId_idx" ON "treatment_logs"("parcelId");

-- CreateIndex
CREATE INDEX "treatment_logs_userId_idx" ON "treatment_logs"("userId");

-- CreateIndex
CREATE INDEX "treatment_logs_appliedAt_idx" ON "treatment_logs"("appliedAt");

-- CreateIndex
CREATE INDEX "border_wait_times_borderArrivalTime_idx" ON "border_wait_times"("borderArrivalTime");

-- CreateIndex
CREATE INDEX "border_wait_times_missionId_idx" ON "border_wait_times"("missionId");

-- CreateIndex
CREATE INDEX "border_wait_times_recordedByUserId_idx" ON "border_wait_times"("recordedByUserId");

-- CreateIndex
CREATE INDEX "compliance_logs_complianceStatus_idx" ON "compliance_logs"("complianceStatus");

-- CreateIndex
CREATE INDEX "compliance_logs_createdAt_idx" ON "compliance_logs"("createdAt");

-- CreateIndex
CREATE INDEX "compliance_logs_entryType_idx" ON "compliance_logs"("entryType");

-- CreateIndex
CREATE INDEX "compliance_logs_estateId_idx" ON "compliance_logs"("estateId");

-- CreateIndex
CREATE INDEX "compliance_logs_farmerId_idx" ON "compliance_logs"("farmerId");

-- CreateIndex
CREATE INDEX "compliance_logs_isCompliant_idx" ON "compliance_logs"("isCompliant");

-- CreateIndex
CREATE INDEX "compliance_logs_parcelId_idx" ON "compliance_logs"("parcelId");

-- CreateIndex
CREATE INDEX "compliance_logs_scannedBarcode_idx" ON "compliance_logs"("scannedBarcode");

-- CreateIndex
CREATE INDEX "compliance_logs_synced_idx" ON "compliance_logs"("synced");

-- CreateIndex
CREATE INDEX "compliance_photos_batchId_idx" ON "compliance_photos"("batchId");

-- CreateIndex
CREATE INDEX "compliance_photos_isVerified_idx" ON "compliance_photos"("isVerified");

-- CreateIndex
CREATE INDEX "compliance_photos_photoType_idx" ON "compliance_photos"("photoType");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryNumber_key" ON "deliveries"("deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryQRCode_key" ON "deliveries"("deliveryQRCode");

-- CreateIndex
CREATE INDEX "deliveries_deliveryQRCode_idx" ON "deliveries"("deliveryQRCode");

-- CreateIndex
CREATE INDEX "deliveries_buyerPickupConfirmedAt_idx" ON "deliveries"("buyerPickupConfirmedAt");

-- CreateIndex
CREATE INDEX "deliveries_driverId_idx" ON "deliveries"("driverId");

-- CreateIndex
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "buyer_delivery_issues_deliveryId_idx" ON "buyer_delivery_issues"("deliveryId");

-- CreateIndex
CREATE INDEX "buyer_delivery_issues_buyerId_idx" ON "buyer_delivery_issues"("buyerId");

-- CreateIndex
CREATE INDEX "buyer_delivery_issues_createdAt_idx" ON "buyer_delivery_issues"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "digital_passports_passportHash_key" ON "digital_passports"("passportHash");

-- CreateIndex
CREATE INDEX "digital_passports_estateId_idx" ON "digital_passports"("estateId");

-- CreateIndex
CREATE INDEX "digital_passports_passportHash_idx" ON "digital_passports"("passportHash");

-- CreateIndex
CREATE INDEX "discount_quota_usage_createdAt_idx" ON "discount_quota_usage"("createdAt");

-- CreateIndex
CREATE INDEX "discount_quota_usage_farmerId_idx" ON "discount_quota_usage"("farmerId");

-- CreateIndex
CREATE INDEX "discount_quota_usage_orderId_idx" ON "discount_quota_usage"("orderId");

-- CreateIndex
CREATE INDEX "distributor_arrivals_arrivalTime_idx" ON "distributor_arrivals"("arrivalTime");

-- CreateIndex
CREATE INDEX "distributor_arrivals_batchId_idx" ON "distributor_arrivals"("batchId");

-- CreateIndex
CREATE INDEX "distributor_arrivals_recordedByUserId_idx" ON "distributor_arrivals"("recordedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "estates_estateQrCode_key" ON "estates"("estateQrCode");

-- CreateIndex
CREATE INDEX "estates_ownerId_idx" ON "estates"("ownerId");

-- CreateIndex
CREATE INDEX "estates_status_idx" ON "estates"("status");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_material_balances_userId_key" ON "farmer_material_balances"("userId");

-- CreateIndex
CREATE INDEX "farmer_material_balances_userId_idx" ON "farmer_material_balances"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "freshness_trackers_batchId_key" ON "freshness_trackers"("batchId");

-- CreateIndex
CREATE INDEX "freshness_trackers_batchId_idx" ON "freshness_trackers"("batchId");

-- CreateIndex
CREATE INDEX "freshness_trackers_expiresAt_idx" ON "freshness_trackers"("expiresAt");

-- CreateIndex
CREATE INDEX "freshness_trackers_isExpired_idx" ON "freshness_trackers"("isExpired");

-- CreateIndex
CREATE UNIQUE INDEX "growth_logs_dataHash_key" ON "growth_logs"("dataHash");

-- CreateIndex
CREATE INDEX "growth_logs_dataHash_idx" ON "growth_logs"("dataHash");

-- CreateIndex
CREATE INDEX "growth_logs_estateId_idx" ON "growth_logs"("estateId");

-- CreateIndex
CREATE INDEX "growth_logs_networkTimestamp_idx" ON "growth_logs"("networkTimestamp");

-- CreateIndex
CREATE INDEX "growth_logs_parcelId_idx" ON "growth_logs"("parcelId");

-- CreateIndex
CREATE INDEX "growth_logs_userId_idx" ON "growth_logs"("userId");

-- CreateIndex
CREATE INDEX "growth_logs_harvestAnnouncementId_idx" ON "growth_logs"("harvestAnnouncementId");

-- CreateIndex
CREATE INDEX "growth_logs_materialBarcode_idx" ON "growth_logs"("materialBarcode");

-- CreateIndex
CREATE INDEX "hubs_city_idx" ON "hubs"("city");

-- CreateIndex
CREATE INDEX "hubs_status_city_idx" ON "hubs"("status", "city");

-- CreateIndex
CREATE INDEX "hubs_status_idx" ON "hubs"("status");

-- CreateIndex
CREATE INDEX "inventory_availableCities_idx" ON "inventory"("availableCities");

-- CreateIndex
CREATE INDEX "inventory_estateId_idx" ON "inventory"("estateId");

-- CreateIndex
CREATE INDEX "inventory_hubId_idx" ON "inventory"("hubId");

-- CreateIndex
CREATE INDEX "inventory_status_idx" ON "inventory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_deliveryId_key" ON "invoices"("deliveryId");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_orderId_idx" ON "invoices"("orderId");

-- CreateIndex
CREATE INDEX "location_logs_batchId_idx" ON "location_logs"("batchId");

-- CreateIndex
CREATE INDEX "location_logs_missionId_idx" ON "location_logs"("missionId");

-- CreateIndex
CREATE INDEX "location_logs_timestamp_idx" ON "location_logs"("timestamp");

-- CreateIndex
CREATE INDEX "location_logs_vehicleId_idx" ON "location_logs"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_handovers_missionId_key" ON "logistics_handovers"("missionId");

-- CreateIndex
CREATE INDEX "logistics_handovers_missionId_idx" ON "logistics_handovers"("missionId");

-- CreateIndex
CREATE INDEX "logistics_handovers_status_idx" ON "logistics_handovers"("status");

-- CreateIndex
CREATE INDEX "logistics_handovers_verifiedBy_idx" ON "logistics_handovers"("verifiedBy");

-- CreateIndex
CREATE INDEX "logistics_handovers_pickupDriverId_idx" ON "logistics_handovers"("pickupDriverId");

-- CreateIndex
CREATE UNIQUE INDEX "package_badges_serial_key" ON "package_badges"("serial");

-- CreateIndex
CREATE INDEX "package_badges_parentId_idx" ON "package_badges"("parentId");

-- CreateIndex
CREATE INDEX "package_badges_ownerUserId_idx" ON "package_badges"("ownerUserId");

-- CreateIndex
CREATE INDEX "package_badges_farmerQrCode_idx" ON "package_badges"("farmerQrCode");

-- CreateIndex
CREATE INDEX "package_badges_batchId_idx" ON "package_badges"("batchId");

-- CreateIndex
CREATE INDEX "package_badges_createdAt_idx" ON "package_badges"("createdAt");

-- CreateIndex
CREATE INDEX "package_badges_printOrderId_idx" ON "package_badges"("printOrderId");

-- CreateIndex
CREATE INDEX "package_badges_lifecycle_idx" ON "package_badges"("lifecycle");

-- CreateIndex
CREATE INDEX "badge_print_orders_requesterUserId_createdAt_idx" ON "badge_print_orders"("requesterUserId", "createdAt");

-- CreateIndex
CREATE INDEX "badge_print_orders_printerSupplierId_idx" ON "badge_print_orders"("printerSupplierId");

-- CreateIndex
CREATE INDEX "badge_print_orders_status_idx" ON "badge_print_orders"("status");

-- CreateIndex
CREATE INDEX "market_prices_cropType_idx" ON "market_prices"("cropType");

-- CreateIndex
CREATE INDEX "market_prices_effectiveFrom_idx" ON "market_prices"("effectiveFrom");

-- CreateIndex
CREATE INDEX "market_prices_isActive_idx" ON "market_prices"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "material_inventory_serialNumber_key" ON "material_inventory"("serialNumber");

-- CreateIndex
CREATE INDEX "material_inventory_materialTypeId_idx" ON "material_inventory"("materialTypeId");

-- CreateIndex
CREATE INDEX "material_inventory_serialNumber_idx" ON "material_inventory"("serialNumber");

-- CreateIndex
CREATE INDEX "material_inventory_soldToUserId_idx" ON "material_inventory"("soldToUserId");

-- CreateIndex
CREATE INDEX "material_inventory_status_idx" ON "material_inventory"("status");

-- CreateIndex
CREATE UNIQUE INDEX "material_types_name_key" ON "material_types"("name");

-- CreateIndex
CREATE INDEX "material_types_isActive_idx" ON "material_types"("isActive");

-- CreateIndex
CREATE INDEX "material_types_type_idx" ON "material_types"("type");

-- CreateIndex
CREATE UNIQUE INDEX "missions_missionNumber_key" ON "missions"("missionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "missions_harvestAnnouncementId_key" ON "missions"("harvestAnnouncementId");

-- CreateIndex
CREATE INDEX "missions_growerId_idx" ON "missions"("growerId");

-- CreateIndex
CREATE INDEX "missions_logisticsPartnerId_idx" ON "missions"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "missions_assignedLogisticsDriverId_idx" ON "missions"("assignedLogisticsDriverId");

-- CreateIndex
CREATE INDEX "missions_missionNumber_idx" ON "missions"("missionNumber");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_harvestAnnouncementId_idx" ON "missions"("harvestAnnouncementId");

-- CreateIndex
CREATE INDEX "missions_destinationCity_idx" ON "missions"("destinationCity");

-- CreateIndex
CREATE INDEX "missions_orderId_idx" ON "missions"("orderId");

-- CreateIndex
CREATE INDEX "notification_templates_trigger_idx" ON "notification_templates"("trigger");

-- CreateIndex
CREATE INDEX "notification_templates_userRole_idx" ON "notification_templates"("userRole");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_push_devices_token_key" ON "user_push_devices"("token");

-- CreateIndex
CREATE INDEX "user_push_devices_userId_idx" ON "user_push_devices"("userId");

-- CreateIndex
CREATE INDEX "user_push_devices_userId_deviceId_idx" ON "user_push_devices"("userId", "deviceId");

-- CreateIndex
CREATE INDEX "order_items_batchId_idx" ON "order_items"("batchId");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_estateId_idx" ON "orders"("estateId");

-- CreateIndex
CREATE INDEX "orders_fulfillingEstateId_idx" ON "orders"("fulfillingEstateId");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_inputSerialNumber_key" ON "parcels"("inputSerialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_publicCode_key" ON "parcels"("publicCode");

-- CreateIndex
CREATE INDEX "parcels_estateId_idx" ON "parcels"("estateId");

-- CreateIndex
CREATE INDEX "parcels_inputSerialNumber_idx" ON "parcels"("inputSerialNumber");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "parcels"("status");

-- CreateIndex
CREATE INDEX "parcels_approvedByUserId_idx" ON "parcels"("approvedByUserId");

-- CreateIndex
CREATE INDEX "harvest_announcements_parcelId_idx" ON "harvest_announcements"("parcelId");

-- CreateIndex
CREATE INDEX "harvest_announcements_userId_idx" ON "harvest_announcements"("userId");

-- CreateIndex
CREATE INDEX "harvest_announcements_estimatedDate_idx" ON "harvest_announcements"("estimatedDate");

-- CreateIndex
CREATE INDEX "harvest_announcements_status_idx" ON "harvest_announcements"("status");

-- CreateIndex
CREATE INDEX "harvest_announcements_marketChannel_idx" ON "harvest_announcements"("marketChannel");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quality_entries_batchId_key" ON "quality_entries"("batchId");

-- CreateIndex
CREATE INDEX "quality_entries_batchId_idx" ON "quality_entries"("batchId");

-- CreateIndex
CREATE INDEX "quality_entries_confirmedBy_idx" ON "quality_entries"("confirmedBy");

-- CreateIndex
CREATE INDEX "quality_entries_status_idx" ON "quality_entries"("status");

-- CreateIndex
CREATE INDEX "ratings_orderId_idx" ON "ratings"("orderId");

-- CreateIndex
CREATE INDEX "ratings_ratedUserId_idx" ON "ratings"("ratedUserId");

-- CreateIndex
CREATE INDEX "ratings_raterId_idx" ON "ratings"("raterId");

-- CreateIndex
CREATE INDEX "ratings_ratingType_idx" ON "ratings"("ratingType");

-- CreateIndex
CREATE INDEX "scraped_prices_cropType_idx" ON "scraped_prices"("cropType");

-- CreateIndex
CREATE INDEX "scraped_prices_location_idx" ON "scraped_prices"("location");

-- CreateIndex
CREATE INDEX "scraped_prices_retailer_idx" ON "scraped_prices"("retailer");

-- CreateIndex
CREATE INDEX "scraped_prices_scrapedAt_idx" ON "scraped_prices"("scrapedAt");

-- CreateIndex
CREATE INDEX "security_alerts_createdAt_idx" ON "security_alerts"("createdAt");

-- CreateIndex
CREATE INDEX "security_alerts_estateId_idx" ON "security_alerts"("estateId");

-- CreateIndex
CREATE INDEX "security_alerts_severity_idx" ON "security_alerts"("severity");

-- CreateIndex
CREATE INDEX "security_alerts_status_idx" ON "security_alerts"("status");

-- CreateIndex
CREATE INDEX "security_alerts_type_idx" ON "security_alerts"("type");

-- CreateIndex
CREATE INDEX "security_alerts_userId_idx" ON "security_alerts"("userId");

-- CreateIndex
CREATE INDEX "seed_scans_inputSerialNumber_idx" ON "seed_scans"("inputSerialNumber");

-- CreateIndex
CREATE INDEX "seed_scans_parcelId_idx" ON "seed_scans"("parcelId");

-- CreateIndex
CREATE INDEX "seed_scans_scannedByUserId_idx" ON "seed_scans"("scannedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "seeds_serialNumber_key" ON "seeds"("serialNumber");

-- CreateIndex
CREATE INDEX "seeds_batchNumber_idx" ON "seeds"("batchNumber");

-- CreateIndex
CREATE INDEX "seeds_serialNumber_idx" ON "seeds"("serialNumber");

-- CreateIndex
CREATE INDEX "seeds_status_idx" ON "seeds"("status");

-- CreateIndex
CREATE INDEX "temperature_logs_batchId_idx" ON "temperature_logs"("batchId");

-- CreateIndex
CREATE INDEX "temperature_logs_isOutOfRange_idx" ON "temperature_logs"("isOutOfRange");

-- CreateIndex
CREATE INDEX "temperature_logs_missionId_idx" ON "temperature_logs"("missionId");

-- CreateIndex
CREATE INDEX "temperature_logs_timestamp_idx" ON "temperature_logs"("timestamp");

-- CreateIndex
CREATE INDEX "temperature_logs_vehicleId_idx" ON "temperature_logs"("vehicleId");

-- CreateIndex
CREATE INDEX "transactions_buyerId_idx" ON "transactions"("buyerId");

-- CreateIndex
CREATE INDEX "transactions_growerId_idx" ON "transactions"("growerId");

-- CreateIndex
CREATE INDEX "transactions_marketPriceId_idx" ON "transactions"("marketPriceId");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "trust_scores_userId_key" ON "trust_scores"("userId");

-- CreateIndex
CREATE INDEX "trust_scores_currentScore_idx" ON "trust_scores"("currentScore");

-- CreateIndex
CREATE INDEX "trust_scores_userId_idx" ON "trust_scores"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "users_partnerCode_key" ON "users"("partnerCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_farmerQrCode_key" ON "users"("farmerQrCode");

-- CreateIndex
CREATE INDEX "users_partnerCode_idx" ON "users"("partnerCode");

-- CreateIndex
CREATE INDEX "users_assignedAgentUserId_idx" ON "users"("assignedAgentUserId");

-- CreateIndex
CREATE UNIQUE INDEX "commercial_agent_profiles_userId_key" ON "commercial_agent_profiles"("userId");

-- CreateIndex
CREATE INDEX "commercial_agent_profiles_city_country_idx" ON "commercial_agent_profiles"("city", "country");

-- CreateIndex
CREATE UNIQUE INDEX "partner_applications_referenceCode_key" ON "partner_applications"("referenceCode");

-- CreateIndex
CREATE INDEX "partner_applications_status_createdAt_idx" ON "partner_applications"("status", "createdAt");

-- CreateIndex
CREATE INDEX "partner_applications_email_idx" ON "partner_applications"("email");

-- CreateIndex
CREATE INDEX "partner_applications_referenceCode_idx" ON "partner_applications"("referenceCode");

-- CreateIndex
CREATE UNIQUE INDEX "material_supplier_profiles_userId_key" ON "material_supplier_profiles"("userId");

-- CreateIndex
CREATE INDEX "material_supplier_profiles_mapApproved_country_idx" ON "material_supplier_profiles"("mapApproved", "country");

-- CreateIndex
CREATE INDEX "material_supplier_profiles_city_idx" ON "material_supplier_profiles"("city");

-- CreateIndex
CREATE INDEX "supplier_catalog_items_supplierUserId_isActive_idx" ON "supplier_catalog_items"("supplierUserId", "isActive");

-- CreateIndex
CREATE INDEX "supplier_catalog_items_supplierUserId_sortOrder_idx" ON "supplier_catalog_items"("supplierUserId", "sortOrder");

-- CreateIndex
CREATE INDEX "supplier_threads_supplierUserId_idx" ON "supplier_threads"("supplierUserId");

-- CreateIndex
CREATE INDEX "supplier_threads_farmerId_idx" ON "supplier_threads"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_threads_farmerId_supplierUserId_key" ON "supplier_threads"("farmerId", "supplierUserId");

-- CreateIndex
CREATE INDEX "supplier_thread_messages_threadId_createdAt_idx" ON "supplier_thread_messages"("threadId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_direct_orders_farmerId_createdAt_idx" ON "supplier_direct_orders"("farmerId", "createdAt");

-- CreateIndex
CREATE INDEX "supplier_direct_orders_supplierUserId_status_idx" ON "supplier_direct_orders"("supplierUserId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_material_barcodes_barcode_key" ON "supplier_material_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "supplier_material_barcodes_supplierUserId_status_idx" ON "supplier_material_barcodes"("supplierUserId", "status");

-- CreateIndex
CREATE INDEX "supplier_material_barcodes_supplierUserId_createdAt_idx" ON "supplier_material_barcodes"("supplierUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_userId_key" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_token_idx" ON "email_verification_tokens"("token");

-- CreateIndex
CREATE INDEX "email_verification_tokens_expiresAt_idx" ON "email_verification_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "logistics_drivers_logisticsPartnerId_idx" ON "logistics_drivers"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "logistics_drivers_isActive_idx" ON "logistics_drivers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNumber_key" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_logisticsPartnerId_idx" ON "vehicles"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vera_insights_cropName_idx" ON "vera_insights"("cropName");

-- CreateIndex
CREATE INDEX "vera_insights_isActive_idx" ON "vera_insights"("isActive");

-- CreateIndex
CREATE INDEX "vera_insights_veraScore_idx" ON "vera_insights"("veraScore");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_waybillNumber_key" ON "waybills"("waybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_deliveryId_key" ON "waybills"("deliveryId");

-- CreateIndex
CREATE INDEX "waybills_deliveryId_idx" ON "waybills"("deliveryId");

-- CreateIndex
CREATE INDEX "waybills_waybillNumber_idx" ON "waybills"("waybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "digital_handovers_deliveryId_key" ON "digital_handovers"("deliveryId");

-- CreateIndex
CREATE INDEX "digital_handovers_deliveryId_idx" ON "digital_handovers"("deliveryId");

-- CreateIndex
CREATE INDEX "digital_handovers_driverId_idx" ON "digital_handovers"("driverId");

-- CreateIndex
CREATE INDEX "digital_handovers_status_idx" ON "digital_handovers"("status");

-- CreateIndex
CREATE INDEX "digital_handovers_initiatedAt_idx" ON "digital_handovers"("initiatedAt");

-- CreateIndex
CREATE INDEX "disputes_handoverId_idx" ON "disputes"("handoverId");

-- CreateIndex
CREATE INDEX "disputes_status_idx" ON "disputes"("status");

-- CreateIndex
CREATE INDEX "disputes_createdAt_idx" ON "disputes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "plot_blueprints_parcelId_key" ON "plot_blueprints"("parcelId");

-- CreateIndex
CREATE INDEX "plot_blueprints_parcelId_idx" ON "plot_blueprints"("parcelId");

-- CreateIndex
CREATE INDEX "ai_conversations_sessionId_idx" ON "ai_conversations"("sessionId");

-- CreateIndex
CREATE INDEX "ai_conversations_contactRequested_idx" ON "ai_conversations"("contactRequested");

-- CreateIndex
CREATE INDEX "ai_conversations_createdAt_idx" ON "ai_conversations"("createdAt");

-- CreateIndex
CREATE INDEX "grower_mobile_ingest_userId_idx" ON "grower_mobile_ingest"("userId");

-- CreateIndex
CREATE INDEX "grower_mobile_ingest_createdAt_idx" ON "grower_mobile_ingest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "grower_mobile_ingest_userId_kind_clientReference_key" ON "grower_mobile_ingest"("userId", "kind", "clientReference");

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_currentHubId_fkey" FOREIGN KEY ("currentHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_harvestedByUserId_fkey" FOREIGN KEY ("harvestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_transportedByDriverId_fkey" FOREIGN KEY ("transportedByDriverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bio_vera_standards" ADD CONSTRAINT "bio_vera_standards_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_logs" ADD CONSTRAINT "treatment_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_logs" ADD CONSTRAINT "treatment_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "border_wait_times" ADD CONSTRAINT "border_wait_times_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "border_wait_times" ADD CONSTRAINT "border_wait_times_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_logs" ADD CONSTRAINT "compliance_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_photos" ADD CONSTRAINT "compliance_photos_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_delivery_issues" ADD CONSTRAINT "buyer_delivery_issues_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_delivery_issues" ADD CONSTRAINT "buyer_delivery_issues_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_passports" ADD CONSTRAINT "digital_passports_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_quota_usage" ADD CONSTRAINT "discount_quota_usage_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_quota_usage" ADD CONSTRAINT "discount_quota_usage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_arrivals" ADD CONSTRAINT "distributor_arrivals_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_arrivals" ADD CONSTRAINT "distributor_arrivals_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estates" ADD CONSTRAINT "estates_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_material_balances" ADD CONSTRAINT "farmer_material_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freshness_trackers" ADD CONSTRAINT "freshness_trackers_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_harvestAnnouncementId_fkey" FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubs" ADD CONSTRAINT "hubs_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_handovers" ADD CONSTRAINT "logistics_handovers_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_handovers" ADD CONSTRAINT "logistics_handovers_pickupDriverId_fkey" FOREIGN KEY ("pickupDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "package_badges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "package_badges" ADD CONSTRAINT "package_badges_printOrderId_fkey" FOREIGN KEY ("printOrderId") REFERENCES "badge_print_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_print_orders" ADD CONSTRAINT "badge_print_orders_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_print_orders" ADD CONSTRAINT "badge_print_orders_printerSupplierId_fkey" FOREIGN KEY ("printerSupplierId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventory" ADD CONSTRAINT "material_inventory_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventory" ADD CONSTRAINT "material_inventory_soldToUserId_fkey" FOREIGN KEY ("soldToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_harvestAnnouncementId_fkey" FOREIGN KEY ("harvestAnnouncementId") REFERENCES "harvest_announcements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_growerId_fkey" FOREIGN KEY ("growerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_assignedLogisticsDriverId_fkey" FOREIGN KEY ("assignedLogisticsDriverId") REFERENCES "logistics_drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_push_devices" ADD CONSTRAINT "user_push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_fulfillingEstateId_fkey" FOREIGN KEY ("fulfillingEstateId") REFERENCES "estates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_announcements" ADD CONSTRAINT "harvest_announcements_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvest_announcements" ADD CONSTRAINT "harvest_announcements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_entries" ADD CONSTRAINT "quality_entries_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "security_alerts" ADD CONSTRAINT "security_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "market_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assignedAgentUserId_fkey" FOREIGN KEY ("assignedAgentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commercial_agent_profiles" ADD CONSTRAINT "commercial_agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_linkedUserId_fkey" FOREIGN KEY ("linkedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_supplier_profiles" ADD CONSTRAINT "material_supplier_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_catalog_items" ADD CONSTRAINT "supplier_catalog_items_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_threads" ADD CONSTRAINT "supplier_threads_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_threads" ADD CONSTRAINT "supplier_threads_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_thread_messages" ADD CONSTRAINT "supplier_thread_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "supplier_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_thread_messages" ADD CONSTRAINT "supplier_thread_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "supplier_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "supplier_catalog_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_soldToFarmerId_fkey" FOREIGN KEY ("soldToFarmerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_material_barcodes" ADD CONSTRAINT "supplier_material_barcodes_directOrderId_fkey" FOREIGN KEY ("directOrderId") REFERENCES "supplier_direct_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_drivers" ADD CONSTRAINT "logistics_drivers_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vera_insights" ADD CONSTRAINT "vera_insights_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_handovers" ADD CONSTRAINT "digital_handovers_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_handovers" ADD CONSTRAINT "digital_handovers_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_handoverId_fkey" FOREIGN KEY ("handoverId") REFERENCES "digital_handovers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plot_blueprints" ADD CONSTRAINT "plot_blueprints_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grower_mobile_ingest" ADD CONSTRAINT "grower_mobile_ingest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

