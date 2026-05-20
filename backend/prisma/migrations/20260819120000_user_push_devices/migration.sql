-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "user_push_devices" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "user_push_devices_token_key" ON "user_push_devices"("token");
CREATE INDEX IF NOT EXISTS "user_push_devices_userId_idx" ON "user_push_devices"("userId");
CREATE INDEX IF NOT EXISTS "user_push_devices_userId_deviceId_idx" ON "user_push_devices"("userId", "deviceId");

DO $$ BEGIN
  ALTER TABLE "user_push_devices" ADD CONSTRAINT "user_push_devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
