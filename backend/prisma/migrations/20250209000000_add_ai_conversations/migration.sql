-- CreateTable
CREATE TABLE IF NOT EXISTS "ai_conversations" (
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

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversations_sessionId_idx" ON "ai_conversations"("sessionId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversations_contactRequested_idx" ON "ai_conversations"("contactRequested");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ai_conversations_createdAt_idx" ON "ai_conversations"("createdAt");
