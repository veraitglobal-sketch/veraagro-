-- B2B material suppliers on map, messaging, direct orders (farmer <-> supplier)
CREATE TYPE "SupplierDirectOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'FULFILLED', 'CANCELLED');

ALTER TYPE "UserRole" ADD VALUE 'MATERIAL_SUPPLIER';

CREATE TABLE "material_supplier_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT NOT NULL,
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

CREATE UNIQUE INDEX "material_supplier_profiles_userId_key" ON "material_supplier_profiles"("userId");
CREATE INDEX "material_supplier_profiles_mapApproved_country_idx" ON "material_supplier_profiles"("mapApproved", "country");
CREATE INDEX "material_supplier_profiles_city_idx" ON "material_supplier_profiles"("city");

ALTER TABLE "material_supplier_profiles" ADD CONSTRAINT "material_supplier_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "supplier_threads" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "supplier_threads_farmerId_supplierUserId_key" ON "supplier_threads"("farmerId", "supplierUserId");
CREATE INDEX "supplier_threads_supplierUserId_idx" ON "supplier_threads"("supplierUserId");
CREATE INDEX "supplier_threads_farmerId_idx" ON "supplier_threads"("farmerId");

ALTER TABLE "supplier_threads" ADD CONSTRAINT "supplier_threads_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_threads" ADD CONSTRAINT "supplier_threads_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "supplier_thread_messages" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_thread_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "supplier_thread_messages_threadId_createdAt_idx" ON "supplier_thread_messages"("threadId", "createdAt");

ALTER TABLE "supplier_thread_messages" ADD CONSTRAINT "supplier_thread_messages_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "supplier_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_thread_messages" ADD CONSTRAINT "supplier_thread_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "supplier_direct_orders" (
    "id" TEXT NOT NULL,
    "threadId" TEXT,
    "farmerId" TEXT NOT NULL,
    "supplierUserId" TEXT NOT NULL,
    "status" "SupplierDirectOrderStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "noteFromFarmer" TEXT,
    "noteFromSupplier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_direct_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "supplier_direct_orders_farmerId_createdAt_idx" ON "supplier_direct_orders"("farmerId", "createdAt");
CREATE INDEX "supplier_direct_orders_supplierUserId_status_idx" ON "supplier_direct_orders"("supplierUserId", "status");

ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "supplier_threads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "supplier_direct_orders" ADD CONSTRAINT "supplier_direct_orders_supplierUserId_fkey" FOREIGN KEY ("supplierUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
