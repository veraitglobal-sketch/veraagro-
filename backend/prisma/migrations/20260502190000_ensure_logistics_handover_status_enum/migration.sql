-- Some databases never applied the squash baseline that defines this enum; Prisma then fails on handover insert.
DO $$
BEGIN
  CREATE TYPE "LogisticsHandoverStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
