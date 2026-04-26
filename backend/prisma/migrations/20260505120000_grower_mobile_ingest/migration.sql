-- Inbox for grower app offline sync (products, costs, certificate metadata)
CREATE TABLE "grower_mobile_ingest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "clientReference" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grower_mobile_ingest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "grower_mobile_ingest_userId_kind_clientReference_key" ON "grower_mobile_ingest"("userId", "kind", "clientReference");

CREATE INDEX "grower_mobile_ingest_userId_idx" ON "grower_mobile_ingest"("userId");

CREATE INDEX "grower_mobile_ingest_createdAt_idx" ON "grower_mobile_ingest"("createdAt");

ALTER TABLE "grower_mobile_ingest" ADD CONSTRAINT "grower_mobile_ingest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
