-- CreateTable
CREATE TABLE IF NOT EXISTS "stored_documents" (
    "id" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileName" TEXT,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stored_documents_pkey" PRIMARY KEY ("id")
);
