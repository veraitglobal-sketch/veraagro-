-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FARMER', 'PARTNER', 'ADMIN', 'DRIVER', 'BUYER', 'SUPER_ADMIN', 'COORDINATOR', 'GROWER', 'LOGISTICS_PARTNER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "EstateStatus" AS ENUM ('ACTIVE', 'INVALID', 'PENDING_SETUP', 'CERTIFIED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('ACTIVE', 'INVALID', 'LOCKED', 'CERTIFIED');

-- CreateEnum
CREATE TYPE "SeedType" AS ENUM ('SEED', 'FERTILIZER');

-- CreateEnum
CREATE TYPE "SeedStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'SCANNED', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ACTION_REQUIRED', 'REMINDER', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_SUSPENDED', 'ESTATE_CREATED', 'ESTATE_VERIFIED', 'SEED_ASSIGNED', 'PARCEL_LOCKED', 'PARCEL_UNLOCKED', 'DATA_EXPORTED', 'CERTIFICATE_GENERATED');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('DRAFT', 'GENERATED', 'VERIFIED', 'EXPORTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'CONFIRMED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'IN_ESCROW', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'CONFIRMED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('EARNED', 'WITHDRAWN', 'REFUNDED', 'PENALTY', 'BONUS');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "HubStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'IN_TRANSIT', 'SOLD', 'EXPIRED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PACKED', 'IN_HUB', 'IN_TRANSIT', 'DELIVERED', 'RETURNED', 'EXPIRED', 'QUALITY_VERIFIED');

-- CreateEnum
CREATE TYPE "NotificationTrigger" AS ENUM ('DELIVERY_ASSIGNED', 'DRIVER_NEARBY', 'PACKAGE_READY', 'PAYMENT_RELEASED', 'QUALITY_ISSUE', 'BATCH_ARRIVED', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MissionStatus" AS ENUM ('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'PICKED_UP', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'READY_FOR_LOADING');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "CropShelfLife" AS ENUM ('RASPBERRIES', 'BLACKBERRIES', 'BLUEBERRIES', 'APPLES', 'PEPPERS');

-- CreateEnum
CREATE TYPE "AuditEventType" AS ENUM ('TEMPERATURE_CHANGE', 'LOCATION_CHANGE', 'STATUS_CHANGE', 'QUALITY_CHECK', 'BATCH_LOCKED', 'BATCH_UNLOCKED', 'PAYMENT_RELEASED', 'PRICE_UPDATED', 'QUALITY_ENTRY', 'LOGISTICS_HANDOVER');

-- CreateEnum
CREATE TYPE "QualityEntryStatus" AS ENUM ('DRAFT', 'COMPLETED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "HandoverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "MaterialTypeEnum" AS ENUM ('CRATE', 'LABEL', 'FILM');

-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('AVAILABLE', 'SOLD', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "partnerCode" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "roles" "UserRole"[] DEFAULT ARRAY['FARMER']::"UserRole"[],
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "passwordHash" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
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
    "dataHash" TEXT NOT NULL,
    "previousLogHash" TEXT,
    "labResultUrl" TEXT,
    "labResultHash" TEXT,
    "labTestDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "growth_logs_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "estateId" TEXT NOT NULL,
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
    "confirmedAt" TIMESTAMP(3),
    "pickupSignature" TEXT,
    "deliverySignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "batches_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "missions" (
    "id" TEXT NOT NULL,
    "missionNumber" TEXT NOT NULL,
    "growerId" TEXT NOT NULL,
    "batchId" TEXT,
    "pickupLocation" JSONB NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "logisticsPartnerId" TEXT,
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

    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "quality_entries" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "weatherAtHarvest" JSONB NOT NULL,
    "preCoolingStartTime" TIMESTAMP(3) NOT NULL,
    "visualGradePhotos" TEXT[],
    "standardConfirmation" BOOLEAN NOT NULL DEFAULT false,
    "confirmedBy" TEXT NOT NULL,
    "status" "QualityEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quality_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_handovers" (
    "id" TEXT NOT NULL,
    "missionId" TEXT NOT NULL,
    "insideTruckTemperature" DOUBLE PRECISION NOT NULL,
    "verifiedBy" TEXT NOT NULL,
    "status" "HandoverStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_handovers_pkey" PRIMARY KEY ("id")
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

-- CreateIndex
CREATE UNIQUE INDEX "users_partnerCode_key" ON "users"("partnerCode");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_partnerCode_idx" ON "users"("partnerCode");

-- CreateIndex
CREATE INDEX "estates_ownerId_idx" ON "estates"("ownerId");

-- CreateIndex
CREATE INDEX "estates_status_idx" ON "estates"("status");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_inputSerialNumber_key" ON "parcels"("inputSerialNumber");

-- CreateIndex
CREATE INDEX "parcels_estateId_idx" ON "parcels"("estateId");

-- CreateIndex
CREATE INDEX "parcels_inputSerialNumber_idx" ON "parcels"("inputSerialNumber");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "parcels"("status");

-- CreateIndex
CREATE UNIQUE INDEX "seeds_serialNumber_key" ON "seeds"("serialNumber");

-- CreateIndex
CREATE INDEX "seeds_serialNumber_idx" ON "seeds"("serialNumber");

-- CreateIndex
CREATE INDEX "seeds_status_idx" ON "seeds"("status");

-- CreateIndex
CREATE INDEX "seeds_batchNumber_idx" ON "seeds"("batchNumber");

-- CreateIndex
CREATE INDEX "seed_scans_inputSerialNumber_idx" ON "seed_scans"("inputSerialNumber");

-- CreateIndex
CREATE INDEX "seed_scans_scannedByUserId_idx" ON "seed_scans"("scannedByUserId");

-- CreateIndex
CREATE INDEX "seed_scans_parcelId_idx" ON "seed_scans"("parcelId");

-- CreateIndex
CREATE UNIQUE INDEX "growth_logs_dataHash_key" ON "growth_logs"("dataHash");

-- CreateIndex
CREATE INDEX "growth_logs_userId_idx" ON "growth_logs"("userId");

-- CreateIndex
CREATE INDEX "growth_logs_estateId_idx" ON "growth_logs"("estateId");

-- CreateIndex
CREATE INDEX "growth_logs_parcelId_idx" ON "growth_logs"("parcelId");

-- CreateIndex
CREATE INDEX "growth_logs_dataHash_idx" ON "growth_logs"("dataHash");

-- CreateIndex
CREATE INDEX "growth_logs_networkTimestamp_idx" ON "growth_logs"("networkTimestamp");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "notifications"("status");

-- CreateIndex
CREATE INDEX "audit_logs_performedByUserId_idx" ON "audit_logs"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "digital_passports_passportHash_key" ON "digital_passports"("passportHash");

-- CreateIndex
CREATE INDEX "digital_passports_estateId_idx" ON "digital_passports"("estateId");

-- CreateIndex
CREATE INDEX "digital_passports_passportHash_idx" ON "digital_passports"("passportHash");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_buyerId_idx" ON "orders"("buyerId");

-- CreateIndex
CREATE INDEX "orders_estateId_idx" ON "orders"("estateId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_orderNumber_idx" ON "orders"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "payments_orderId_key" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryNumber_key" ON "deliveries"("deliveryNumber");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_orderId_key" ON "deliveries"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryQRCode_key" ON "deliveries"("deliveryQRCode");

-- CreateIndex
CREATE INDEX "deliveries_orderId_idx" ON "deliveries"("orderId");

-- CreateIndex
CREATE INDEX "deliveries_driverId_idx" ON "deliveries"("driverId");

-- CreateIndex
CREATE INDEX "deliveries_status_idx" ON "deliveries"("status");

-- CreateIndex
CREATE INDEX "deliveries_deliveryQRCode_idx" ON "deliveries"("deliveryQRCode");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_waybillNumber_key" ON "waybills"("waybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "waybills_deliveryId_key" ON "waybills"("deliveryId");

-- CreateIndex
CREATE INDEX "waybills_deliveryId_idx" ON "waybills"("deliveryId");

-- CreateIndex
CREATE INDEX "waybills_waybillNumber_idx" ON "waybills"("waybillNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_orderId_key" ON "invoices"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_deliveryId_key" ON "invoices"("deliveryId");

-- CreateIndex
CREATE INDEX "invoices_orderId_idx" ON "invoices"("orderId");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "ratings_orderId_idx" ON "ratings"("orderId");

-- CreateIndex
CREATE INDEX "ratings_raterId_idx" ON "ratings"("raterId");

-- CreateIndex
CREATE INDEX "ratings_ratedUserId_idx" ON "ratings"("ratedUserId");

-- CreateIndex
CREATE INDEX "ratings_ratingType_idx" ON "ratings"("ratingType");

-- CreateIndex
CREATE UNIQUE INDEX "trust_scores_userId_key" ON "trust_scores"("userId");

-- CreateIndex
CREATE INDEX "trust_scores_userId_idx" ON "trust_scores"("userId");

-- CreateIndex
CREATE INDEX "trust_scores_currentScore_idx" ON "trust_scores"("currentScore");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallets_userId_idx" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallet_transactions_walletId_idx" ON "wallet_transactions"("walletId");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_idx" ON "wallet_transactions"("type");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");

-- CreateIndex
CREATE INDEX "hubs_city_idx" ON "hubs"("city");

-- CreateIndex
CREATE INDEX "hubs_status_idx" ON "hubs"("status");

-- CreateIndex
CREATE INDEX "inventory_hubId_idx" ON "inventory"("hubId");

-- CreateIndex
CREATE INDEX "inventory_estateId_idx" ON "inventory"("estateId");

-- CreateIndex
CREATE INDEX "inventory_status_idx" ON "inventory"("status");

-- CreateIndex
CREATE INDEX "inventory_availableCities_idx" ON "inventory"("availableCities");

-- CreateIndex
CREATE UNIQUE INDEX "batches_batchId_key" ON "batches"("batchId");

-- CreateIndex
CREATE INDEX "batches_batchId_idx" ON "batches"("batchId");

-- CreateIndex
CREATE INDEX "batches_estateId_idx" ON "batches"("estateId");

-- CreateIndex
CREATE INDEX "batches_currentHubId_idx" ON "batches"("currentHubId");

-- CreateIndex
CREATE INDEX "batches_status_idx" ON "batches"("status");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_batchId_idx" ON "order_items"("batchId");

-- CreateIndex
CREATE INDEX "notification_templates_trigger_idx" ON "notification_templates"("trigger");

-- CreateIndex
CREATE INDEX "notification_templates_userRole_idx" ON "notification_templates"("userRole");

-- CreateIndex
CREATE INDEX "market_prices_cropType_idx" ON "market_prices"("cropType");

-- CreateIndex
CREATE INDEX "market_prices_isActive_idx" ON "market_prices"("isActive");

-- CreateIndex
CREATE INDEX "market_prices_effectiveFrom_idx" ON "market_prices"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "missions_missionNumber_key" ON "missions"("missionNumber");

-- CreateIndex
CREATE INDEX "missions_growerId_idx" ON "missions"("growerId");

-- CreateIndex
CREATE INDEX "missions_logisticsPartnerId_idx" ON "missions"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "missions_status_idx" ON "missions"("status");

-- CreateIndex
CREATE INDEX "missions_missionNumber_idx" ON "missions"("missionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNumber_key" ON "vehicles"("vehicleNumber");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_licensePlate_key" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE INDEX "vehicles_logisticsPartnerId_idx" ON "vehicles"("logisticsPartnerId");

-- CreateIndex
CREATE INDEX "vehicles_status_idx" ON "vehicles"("status");

-- CreateIndex
CREATE INDEX "vehicles_licensePlate_idx" ON "vehicles"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "freshness_trackers_batchId_key" ON "freshness_trackers"("batchId");

-- CreateIndex
CREATE INDEX "freshness_trackers_batchId_idx" ON "freshness_trackers"("batchId");

-- CreateIndex
CREATE INDEX "freshness_trackers_expiresAt_idx" ON "freshness_trackers"("expiresAt");

-- CreateIndex
CREATE INDEX "freshness_trackers_isExpired_idx" ON "freshness_trackers"("isExpired");

-- CreateIndex
CREATE INDEX "audit_trails_eventType_idx" ON "audit_trails"("eventType");

-- CreateIndex
CREATE INDEX "audit_trails_entityType_entityId_idx" ON "audit_trails"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_trails_performedByUserId_idx" ON "audit_trails"("performedByUserId");

-- CreateIndex
CREATE INDEX "audit_trails_timestamp_idx" ON "audit_trails"("timestamp");

-- CreateIndex
CREATE INDEX "temperature_logs_missionId_idx" ON "temperature_logs"("missionId");

-- CreateIndex
CREATE INDEX "temperature_logs_vehicleId_idx" ON "temperature_logs"("vehicleId");

-- CreateIndex
CREATE INDEX "temperature_logs_batchId_idx" ON "temperature_logs"("batchId");

-- CreateIndex
CREATE INDEX "temperature_logs_timestamp_idx" ON "temperature_logs"("timestamp");

-- CreateIndex
CREATE INDEX "temperature_logs_isOutOfRange_idx" ON "temperature_logs"("isOutOfRange");

-- CreateIndex
CREATE INDEX "location_logs_missionId_idx" ON "location_logs"("missionId");

-- CreateIndex
CREATE INDEX "location_logs_vehicleId_idx" ON "location_logs"("vehicleId");

-- CreateIndex
CREATE INDEX "location_logs_batchId_idx" ON "location_logs"("batchId");

-- CreateIndex
CREATE INDEX "location_logs_timestamp_idx" ON "location_logs"("timestamp");

-- CreateIndex
CREATE INDEX "transactions_marketPriceId_idx" ON "transactions"("marketPriceId");

-- CreateIndex
CREATE INDEX "transactions_growerId_idx" ON "transactions"("growerId");

-- CreateIndex
CREATE INDEX "transactions_buyerId_idx" ON "transactions"("buyerId");

-- CreateIndex
CREATE INDEX "transactions_transactionDate_idx" ON "transactions"("transactionDate");

-- CreateIndex
CREATE UNIQUE INDEX "quality_entries_batchId_key" ON "quality_entries"("batchId");

-- CreateIndex
CREATE INDEX "quality_entries_batchId_idx" ON "quality_entries"("batchId");

-- CreateIndex
CREATE INDEX "quality_entries_status_idx" ON "quality_entries"("status");

-- CreateIndex
CREATE INDEX "quality_entries_confirmedBy_idx" ON "quality_entries"("confirmedBy");

-- CreateIndex
CREATE UNIQUE INDEX "logistics_handovers_missionId_key" ON "logistics_handovers"("missionId");

-- CreateIndex
CREATE INDEX "logistics_handovers_missionId_idx" ON "logistics_handovers"("missionId");

-- CreateIndex
CREATE INDEX "logistics_handovers_status_idx" ON "logistics_handovers"("status");

-- CreateIndex
CREATE INDEX "logistics_handovers_verifiedBy_idx" ON "logistics_handovers"("verifiedBy");

-- CreateIndex
CREATE INDEX "distributor_arrivals_batchId_idx" ON "distributor_arrivals"("batchId");

-- CreateIndex
CREATE INDEX "distributor_arrivals_arrivalTime_idx" ON "distributor_arrivals"("arrivalTime");

-- CreateIndex
CREATE INDEX "distributor_arrivals_recordedByUserId_idx" ON "distributor_arrivals"("recordedByUserId");

-- CreateIndex
CREATE INDEX "border_wait_times_missionId_idx" ON "border_wait_times"("missionId");

-- CreateIndex
CREATE INDEX "border_wait_times_borderArrivalTime_idx" ON "border_wait_times"("borderArrivalTime");

-- CreateIndex
CREATE INDEX "border_wait_times_recordedByUserId_idx" ON "border_wait_times"("recordedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "material_types_name_key" ON "material_types"("name");

-- CreateIndex
CREATE INDEX "material_types_type_idx" ON "material_types"("type");

-- CreateIndex
CREATE INDEX "material_types_isActive_idx" ON "material_types"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "material_inventory_serialNumber_key" ON "material_inventory"("serialNumber");

-- CreateIndex
CREATE INDEX "material_inventory_materialTypeId_idx" ON "material_inventory"("materialTypeId");

-- CreateIndex
CREATE INDEX "material_inventory_soldToUserId_idx" ON "material_inventory"("soldToUserId");

-- CreateIndex
CREATE INDEX "material_inventory_status_idx" ON "material_inventory"("status");

-- CreateIndex
CREATE INDEX "material_inventory_serialNumber_idx" ON "material_inventory"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_material_balances_userId_key" ON "farmer_material_balances"("userId");

-- CreateIndex
CREATE INDEX "farmer_material_balances_userId_idx" ON "farmer_material_balances"("userId");

-- CreateIndex
CREATE INDEX "compliance_photos_batchId_idx" ON "compliance_photos"("batchId");

-- CreateIndex
CREATE INDEX "compliance_photos_photoType_idx" ON "compliance_photos"("photoType");

-- CreateIndex
CREATE INDEX "compliance_photos_isVerified_idx" ON "compliance_photos"("isVerified");

-- CreateIndex
CREATE INDEX "bio_vera_standards_isActive_idx" ON "bio_vera_standards"("isActive");

-- AddForeignKey
ALTER TABLE "estates" ADD CONSTRAINT "estates_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "seeds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_scannedByUserId_fkey" FOREIGN KEY ("scannedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seed_scans" ADD CONSTRAINT "seed_scans_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "growth_logs" ADD CONSTRAINT "growth_logs_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "digital_passports" ADD CONSTRAINT "digital_passports_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "waybills" ADD CONSTRAINT "waybills_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratedUserId_fkey" FOREIGN KEY ("ratedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trust_scores" ADD CONSTRAINT "trust_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hubs" ADD CONSTRAINT "hubs_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_estateId_fkey" FOREIGN KEY ("estateId") REFERENCES "estates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_harvestedByUserId_fkey" FOREIGN KEY ("harvestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_currentHubId_fkey" FOREIGN KEY ("currentHubId") REFERENCES "hubs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_transportedByDriverId_fkey" FOREIGN KEY ("transportedByDriverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "batches" ADD CONSTRAINT "batches_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "market_prices" ADD CONSTRAINT "market_prices_setByUserId_fkey" FOREIGN KEY ("setByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_growerId_fkey" FOREIGN KEY ("growerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "missions" ADD CONSTRAINT "missions_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_logisticsPartnerId_fkey" FOREIGN KEY ("logisticsPartnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "freshness_trackers" ADD CONSTRAINT "freshness_trackers_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_performedByUserId_fkey" FOREIGN KEY ("performedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temperature_logs" ADD CONSTRAINT "temperature_logs_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "location_logs" ADD CONSTRAINT "location_logs_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_marketPriceId_fkey" FOREIGN KEY ("marketPriceId") REFERENCES "market_prices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_entries" ADD CONSTRAINT "quality_entries_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_handovers" ADD CONSTRAINT "logistics_handovers_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_arrivals" ADD CONSTRAINT "distributor_arrivals_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distributor_arrivals" ADD CONSTRAINT "distributor_arrivals_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "border_wait_times" ADD CONSTRAINT "border_wait_times_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "missions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "border_wait_times" ADD CONSTRAINT "border_wait_times_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventory" ADD CONSTRAINT "material_inventory_materialTypeId_fkey" FOREIGN KEY ("materialTypeId") REFERENCES "material_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_inventory" ADD CONSTRAINT "material_inventory_soldToUserId_fkey" FOREIGN KEY ("soldToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_material_balances" ADD CONSTRAINT "farmer_material_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_photos" ADD CONSTRAINT "compliance_photos_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "batches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bio_vera_standards" ADD CONSTRAINT "bio_vera_standards_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
