-- Season pre-orders (planning quantities). Previously the web form only simulated a submit.
CREATE TABLE IF NOT EXISTS "pre_orders" (
    "id" TEXT NOT NULL,
    "season" INTEGER NOT NULL,
    "buyerId" TEXT,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "lines" JSONB NOT NULL,
    "totalKg" DOUBLE PRECISION NOT NULL,
    "deliveryFrom" TEXT,
    "deliveryTo" TEXT,
    "quality" TEXT,
    "packaging" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pre_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "pre_orders_season_status_idx" ON "pre_orders"("season", "status");
CREATE INDEX IF NOT EXISTS "pre_orders_buyerId_idx" ON "pre_orders"("buyerId");
CREATE INDEX IF NOT EXISTS "pre_orders_createdAt_idx" ON "pre_orders"("createdAt");

DO $$ BEGIN
    ALTER TABLE "pre_orders" ADD CONSTRAINT "pre_orders_buyerId_fkey"
        FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
