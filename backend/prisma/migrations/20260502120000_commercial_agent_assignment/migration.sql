-- Commercial field agents: assign growers / logistics / B2B suppliers; optional office per agent for proximity
ALTER TYPE "UserRole" ADD VALUE 'COMMERCIAL_AGENT';

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

CREATE UNIQUE INDEX "commercial_agent_profiles_userId_key" ON "commercial_agent_profiles"("userId");
CREATE INDEX "commercial_agent_profiles_city_country_idx" ON "commercial_agent_profiles"("city", "country");

ALTER TABLE "commercial_agent_profiles" ADD CONSTRAINT "commercial_agent_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "assignedAgentUserId" TEXT;
CREATE INDEX "users_assignedAgentUserId_idx" ON "users"("assignedAgentUserId");
ALTER TABLE "users" ADD CONSTRAINT "users_assignedAgentUserId_fkey" FOREIGN KEY ("assignedAgentUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
