-- Prisma maps logistics_handovers.status to HandoverStatus. Baseline used LogisticsHandoverStatus on the column;
-- some live databases already have HandoverStatus. Convert only when the column still uses LogisticsHandoverStatus.

DO $$
DECLARE
  udt text;
BEGIN
  SELECT c.udt_name INTO udt
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'logistics_handovers'
    AND c.column_name = 'status';

  IF udt IS NOT NULL AND lower(udt) = 'logisticshandoverstatus' THEN
    ALTER TABLE "logistics_handovers" ALTER COLUMN "status" DROP DEFAULT;
    ALTER TABLE "logistics_handovers"
      ALTER COLUMN "status" TYPE "HandoverStatus"
      USING ("status"::text::"HandoverStatus");
    ALTER TABLE "logistics_handovers"
      ALTER COLUMN "status" SET DEFAULT 'PENDING'::"HandoverStatus";
  END IF;
END $$;
