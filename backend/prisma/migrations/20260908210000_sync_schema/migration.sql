-- Backfill the tenant-aware schema from the legacy tables before enforcing constraints.
CREATE TYPE "MeasurementSetStatus" AS ENUM ('ACTIVE', 'SUPERSEDED', 'ARCHIVED');
ALTER TYPE "UserRole" ADD VALUE 'ADMIN';
ALTER TYPE "UserRole" ADD VALUE 'TAILOR';

ALTER TABLE "Business" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Customer" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Material" ADD COLUMN "code" TEXT;
ALTER TABLE "Material" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Order" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "OrderHistory" ADD COLUMN "businessId" TEXT;
ALTER TABLE "OrderMaterial" ADD COLUMN "businessId" TEXT;
ALTER TABLE "OrderMaterial" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Payment" ADD COLUMN "idempotencyKey" VARCHAR(128);
ALTER TABLE "StockMovement" ADD COLUMN "businessId" TEXT;

CREATE TABLE "MeasurementSet" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "orderId" TEXT,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "MeasurementSetStatus" NOT NULL DEFAULT 'ACTIVE',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MeasurementSet_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Measurement" ADD COLUMN "businessId" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "measurementSetId" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "Material" SET "code" = 'MAT-' || md5("id") WHERE "code" IS NULL;
UPDATE "Order" o SET "businessId" = c."businessId" FROM "Customer" c WHERE c."id" = o."customerId";
UPDATE "OrderHistory" h SET "businessId" = o."businessId" FROM "Order" o WHERE o."id" = h."orderId";
UPDATE "OrderMaterial" om SET "businessId" = o."businessId" FROM "Order" o WHERE o."id" = om."orderId";
UPDATE "Payment" p SET "businessId" = o."businessId" FROM "Order" o WHERE o."id" = p."orderId";
UPDATE "StockMovement" sm SET "businessId" = m."businessId" FROM "Material" m WHERE m."id" = sm."materialId";

INSERT INTO "MeasurementSet" ("id", "businessId", "customerId", "version", "updatedAt")
SELECT md5('legacy-measurement-set:' || c."id"), c."businessId", c."id", 1, CURRENT_TIMESTAMP
FROM "Customer" c
WHERE EXISTS (SELECT 1 FROM "Measurement" m WHERE m."customerId" = c."id")
ON CONFLICT ("id") DO NOTHING;

UPDATE "Measurement" m
SET "businessId" = c."businessId",
    "measurementSetId" = md5('legacy-measurement-set:' || c."id")
FROM "Customer" c
WHERE c."id" = m."customerId";

ALTER TABLE "Measurement" DROP CONSTRAINT "Measurement_customerId_fkey";
ALTER TABLE "Measurement" DROP COLUMN "customerId";
ALTER TABLE "Measurement" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Measurement" ALTER COLUMN "measurementSetId" SET NOT NULL;
ALTER TABLE "Material" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "OrderHistory" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "OrderMaterial" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "businessId" SET NOT NULL;
ALTER TABLE "StockMovement" ALTER COLUMN "businessId" SET NOT NULL;

CREATE UNIQUE INDEX "User_businessId_email_key" ON "User" ("businessId", "email");
DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "Customer" ("businessId", "phone");
DROP INDEX IF EXISTS "Customer_businessId_phone_idx";
CREATE UNIQUE INDEX "Material_businessId_code_key" ON "Material" ("businessId", "code");
CREATE UNIQUE INDEX "OrderMaterial_orderId_materialId_key" ON "OrderMaterial" ("orderId", "materialId");
CREATE UNIQUE INDEX "MeasurementSet_customerId_orderId_version_key" ON "MeasurementSet" ("customerId", "orderId", "version");
CREATE UNIQUE INDEX "Payment_orderId_idempotencyKey_key" ON "Payment" ("orderId", "idempotencyKey");

CREATE INDEX "Business_deletedAt_idx" ON "Business" ("deletedAt");
CREATE INDEX "Customer_businessId_email_idx" ON "Customer" ("businessId", "email");
CREATE INDEX "Customer_deletedAt_idx" ON "Customer" ("deletedAt");
CREATE INDEX "Material_businessId_code_idx" ON "Material" ("businessId", "code");
CREATE INDEX "Material_deletedAt_idx" ON "Material" ("deletedAt");
CREATE INDEX "MeasurementSet_businessId_idx" ON "MeasurementSet" ("businessId");
CREATE INDEX "MeasurementSet_customerId_idx" ON "MeasurementSet" ("customerId");
CREATE INDEX "MeasurementSet_orderId_idx" ON "MeasurementSet" ("orderId");
CREATE INDEX "MeasurementSet_businessId_customerId_idx" ON "MeasurementSet" ("businessId", "customerId");
CREATE INDEX "MeasurementSet_businessId_orderId_idx" ON "MeasurementSet" ("businessId", "orderId");
CREATE INDEX "MeasurementSet_deletedAt_idx" ON "MeasurementSet" ("deletedAt");
CREATE INDEX "Measurement_businessId_idx" ON "Measurement" ("businessId");
CREATE INDEX "Measurement_measurementSetId_idx" ON "Measurement" ("measurementSetId");
CREATE INDEX "Measurement_businessId_createdAt_idx" ON "Measurement" ("businessId", "createdAt");
CREATE INDEX "Measurement_deletedAt_idx" ON "Measurement" ("deletedAt");
CREATE INDEX "Order_businessId_idx" ON "Order" ("businessId");
CREATE INDEX "Order_businessId_customerId_idx" ON "Order" ("businessId", "customerId");
CREATE INDEX "Order_businessId_status_idx" ON "Order" ("businessId", "status");
CREATE INDEX "Order_businessId_orderDate_idx" ON "Order" ("businessId", "orderDate");
CREATE INDEX "Order_deletedAt_idx" ON "Order" ("deletedAt");
CREATE INDEX "OrderHistory_businessId_idx" ON "OrderHistory" ("businessId");
CREATE INDEX "OrderMaterial_businessId_idx" ON "OrderMaterial" ("businessId");
CREATE INDEX "OrderMaterial_deletedAt_idx" ON "OrderMaterial" ("deletedAt");
CREATE INDEX "Payment_businessId_idx" ON "Payment" ("businessId");
CREATE INDEX "Payment_businessId_orderId_idx" ON "Payment" ("businessId", "orderId");
CREATE INDEX "Payment_businessId_paymentDate_idx" ON "Payment" ("businessId", "paymentDate");
CREATE INDEX "Payment_idempotencyKey_idx" ON "Payment" ("idempotencyKey");
CREATE INDEX "Payment_deletedAt_idx" ON "Payment" ("deletedAt");
CREATE INDEX "StockMovement_businessId_idx" ON "StockMovement" ("businessId");
CREATE INDEX "StockMovement_businessId_materialId_createdAt_idx" ON "StockMovement" ("businessId", "materialId", "createdAt");
CREATE INDEX "User_businessId_isActive_idx" ON "User" ("businessId", "isActive");
CREATE INDEX "User_deletedAt_idx" ON "User" ("deletedAt");

ALTER TABLE "MeasurementSet" ADD CONSTRAINT "MeasurementSet_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeasurementSet" ADD CONSTRAINT "MeasurementSet_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MeasurementSet" ADD CONSTRAINT "MeasurementSet_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_measurementSetId_fkey" FOREIGN KEY ("measurementSetId") REFERENCES "MeasurementSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
