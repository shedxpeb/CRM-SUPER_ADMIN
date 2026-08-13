-- Migration: Add Sync Tracking to Tenant Table
-- Created: 2026-08-13
-- Description: Add sync tracking fields to Tenant table for monitoring CRM synchronization

-- ============================================================================
-- Add Sync Tracking Fields to Tenant Table
-- ============================================================================

DO $$
BEGIN
    -- Add lastSyncedAt if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'lastSyncedAt'
    ) THEN
        ALTER TABLE "tenants" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
    END IF;

    -- Add syncError if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'syncError'
    ) THEN
        ALTER TABLE "tenants" ADD COLUMN "syncError" TEXT;
    END IF;

    -- Add syncVersion if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tenants' AND column_name = 'syncVersion'
    ) THEN
        ALTER TABLE "tenants" ADD COLUMN "syncVersion" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create indexes for sync tracking
CREATE INDEX IF NOT EXISTS "tenants_syncState_idx" ON "tenants"("syncState");
CREATE INDEX IF NOT EXISTS "tenants_lastSyncedAt_idx" ON "tenants"("lastSyncedAt");

-- ============================================================================
-- Add UUID Check Constraint for crmOrganizationId
-- ============================================================================

-- Note: This is a cross-database reference, so we cannot add a real FK constraint
-- Instead, we add a check constraint to ensure the value is a valid UUID when set
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'tenants_crmOrganizationId_uuid_check'
    ) THEN
        ALTER TABLE "tenants"
        ADD CONSTRAINT "tenants_crmOrganizationId_uuid_check"
        CHECK ("crmOrganizationId" IS NULL OR "crmOrganizationId" ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
    END IF;
END $$;

-- ============================================================================
-- Create Trigger for Sync State Cleanup
-- ============================================================================

-- Function to reset sync state for active tenants stuck in SYNCING state for too long
CREATE OR REPLACE FUNCTION reset_stuck_sync_states()
RETURNS void AS $$
BEGIN
    UPDATE "tenants"
    SET "syncState" = 'FAILED',
        "syncError" = 'Sync timeout - state was stuck in SYNCING for too long',
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "syncState" = 'SYNCING'
      AND "lastSyncedAt" < CURRENT_TIMESTAMP - INTERVAL '1 hour'
      AND "isDeleted" = false;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Create View for Sync Status Monitoring
-- ============================================================================

CREATE OR REPLACE VIEW "tenant_sync_status" AS
SELECT
    t.id AS "tenantId",
    t.name AS "tenantName",
    t.slug,
    t."crmOrganizationId",
    t."syncState",
    t."lastSyncedAt",
    t."syncError",
    t."syncVersion",
    t.status AS "tenantStatus",
    t."isDeleted",
    t."updatedAt",
    CASE
        WHEN t."syncState" = 'SYNCED' THEN true
        WHEN t."syncState" = 'PENDING' THEN true
        WHEN t."syncState" = 'SYNCING' AND t."lastSyncedAt" > CURRENT_TIMESTAMP - INTERVAL '1 hour' THEN true
        ELSE false
    END AS "isHealthy"
FROM "tenants" t
WHERE t."isDeleted" = false;

COMMENT ON VIEW "tenant_sync_status" IS 'Monitor sync health across all tenants';

-- ============================================================================
-- Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN "tenants"."lastSyncedAt" IS 'Timestamp of last successful sync with CRM database';
COMMENT ON COLUMN "tenants"."syncError" IS 'Error message from last failed sync attempt';
COMMENT ON COLUMN "tenants"."syncVersion" IS 'Version counter for detecting sync conflicts';

-- ============================================================================
-- Migration Complete
-- ============================================================================
