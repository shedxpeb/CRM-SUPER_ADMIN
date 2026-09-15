-- AddPermissionPoolAuditFields
-- Migration to add audit fields for tracking permission pool modifications

-- Add audit fields to Tenant model
ALTER TABLE "tenants"
ADD COLUMN "poolModifiedById" TEXT,
ADD COLUMN "poolModifiedAt" TIMESTAMP(3);

-- Create index for audit queries
CREATE INDEX IF NOT EXISTS "tenants_poolModifiedById_idx" ON "tenants"("poolModifiedById");
CREATE INDEX IF NOT EXISTS "tenants_poolModifiedAt_idx" ON "tenants"("poolModifiedAt");
