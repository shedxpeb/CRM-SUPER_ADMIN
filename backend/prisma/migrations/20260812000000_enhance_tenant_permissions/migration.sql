-- Migration: Enhance Tenant Permission Management
-- Created: 2026-08-12
-- Description: Add support for permission templates, tenant permission grants, and enhanced tenant management

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. Update Tenant Model for Enhanced Permission Management
-- ============================================================================

-- Add permission pool and hierarchy columns to Tenant table
ALTER TABLE "tenants" 
ADD COLUMN IF NOT EXISTS "permissionPool" JSONB,
ADD COLUMN IF NOT EXISTS "roleHierarchyEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "maxRoleDepth" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS "customPermissionsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- ============================================================================
-- 2. Create PermissionTemplate Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "permission_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "permission_templates_pkey" PRIMARY KEY ("id")
);

-- Create indexes for permission_templates
CREATE INDEX IF NOT EXISTS "permission_templates_isActive_idx" ON "permission_templates"("isActive");
CREATE INDEX IF NOT EXISTS "permission_templates_category_idx" ON "permission_templates"("category");

-- ============================================================================
-- 3. Create TenantPermissionGrant Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "tenant_permission_grants" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "conditions" JSONB,

    CONSTRAINT "tenant_permission_grants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tenant_permission_grants_tenantId_permissionId_key" UNIQUE ("tenantId", "permissionId")
);

-- Create indexes for tenant_permission_grants
CREATE INDEX IF NOT EXISTS "tenant_permission_grants_tenantId_idx" ON "tenant_permission_grants"("tenantId");
CREATE INDEX IF NOT EXISTS "tenant_permission_grants_permissionId_idx" ON "tenant_permission_grants"("permissionId");
CREATE INDEX IF NOT EXISTS "tenant_permission_grants_expiresAt_idx" ON "tenant_permission_grants"("expiresAt");

-- Add foreign key constraint to tenants table
ALTER TABLE "tenant_permission_grants" 
ADD CONSTRAINT "tenant_permission_grants_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- 4. Create Default Permission Templates
-- ============================================================================

-- Basic Tenant Admin Template
INSERT INTO "permission_templates" ("id", "name", "description", "category", "permissions", "isSystem", "isActive", "createdAt", "updatedAt")
VALUES 
  (gen_random_uuid(), 'Basic Tenant Admin', 'Basic permissions for tenant administration', 'tenant_admin', 
   '["users.view", "users.create", "users.update", "roles.view", "roles.create", "roles.update", "organization.view", "organization.update"]'::jsonb, 
   true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Sales Manager Template
  (gen_random_uuid(), 'Sales Manager', 'Permissions for sales team management', 'sales',
   '["leads.view", "leads.create", "leads.update", "customers.view", "customers.create", "customers.update", "projects.view", "tasks.view", "tasks.create"]'::jsonb,
   true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Full Access Template
  (gen_random_uuid(), 'Full Access', 'Full access to all modules (for enterprise tenants)', 'enterprise',
   '["leads.view", "leads.create", "leads.update", "leads.delete", "leads.export", "leads.import",
     "customers.view", "customers.create", "customers.update", "customers.delete", "customers.export",
     "projects.view", "projects.create", "projects.update", "projects.delete", "projects.manage",
     "inventory.view", "inventory.create", "inventory.update", "inventory.delete", "inventory.manage",
     "purchase_orders.view", "purchase_orders.create", "purchase_orders.update", "purchase_orders.delete", "purchase_orders.approve",
     "users.view", "users.create", "users.update", "users.delete", "users.manage",
     "roles.view", "roles.create", "roles.update", "roles.delete", "roles.manage",
     "organization.view", "organization.update", "organization.manage",
     "tasks.view", "tasks.create", "tasks.update", "tasks.delete", "tasks.manage",
     "reports.view", "reports.export", "reports.manage"]'::jsonb,
   true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Read Only Template
  (gen_random_uuid(), 'Read Only', 'Read-only access to all modules', 'read_only',
   '["leads.view", "customers.view", "projects.view", "inventory.view", "purchase_orders.view", "users.view", "roles.view", "organization.view", "tasks.view", "reports.view"]'::jsonb,
   true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

  -- Operations Manager Template
  (gen_random_uuid(), 'Operations Manager', 'Permissions for operations and inventory management', 'operations',
   '["inventory.view", "inventory.create", "inventory.update", "inventory.delete", "inventory.manage",
     "purchase_orders.view", "purchase_orders.create", "purchase_orders.update", "purchase_orders.approve",
     "projects.view", "projects.update", "tasks.view", "tasks.create", "tasks.update"]'::jsonb,
   true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- 5. Update TenantModuleOverride for Enhanced Module Control
-- ============================================================================

-- Add module description and configuration support
ALTER TABLE "tenant_module_overrides" 
ADD COLUMN IF NOT EXISTS "description" TEXT,
ADD COLUMN IF NOT EXISTS "config" JSONB;

-- ============================================================================
-- 6. Create Enhanced Audit Logging Support
-- ============================================================================

-- Add permission-specific audit tracking
-- This enhances the existing platform_audit_logs table with permission-specific metadata

-- ============================================================================
-- 7. Add Comments for Documentation
-- ============================================================================

COMMENT ON TABLE "permission_templates" IS 'Reusable permission templates for tenant onboarding and management';
COMMENT ON TABLE "tenant_permission_grants" IS 'Track explicit permission grants to tenants with expiration and revocation';
COMMENT ON COLUMN "tenants"."permissionPool" IS 'Pool of permissions delegated by Super Admin to Tenant Admin';
COMMENT ON COLUMN "tenants"."roleHierarchyEnabled" IS 'Whether tenant can use hierarchical role system';
COMMENT ON COLUMN "tenants"."maxRoleDepth" IS 'Maximum allowed depth for tenant role hierarchy';
COMMENT ON COLUMN "tenants"."customPermissionsEnabled" IS 'Whether tenant can create custom permissions beyond pool';
COMMENT ON COLUMN "tenant_permission_grants"."conditions" IS 'Conditional permission logic (e.g., time-based, IP-based)';

-- ============================================================================
-- 8. Create Trigger for Permission Grant Expiration
-- ============================================================================

-- Function to check and auto-revoke expired permissions
CREATE OR REPLACE FUNCTION check_expired_permission_grants()
RETURNS void AS $$
BEGIN
    UPDATE "tenant_permission_grants"
    SET "revokedAt" = CURRENT_TIMESTAMP,
        "revokedBy" = 'SYSTEM'
    WHERE "expiresAt" < CURRENT_TIMESTAMP
      AND "revokedAt" IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Create index to support efficient expiration checking
CREATE INDEX IF NOT EXISTS "tenant_permission_grants_expiresAt_active_idx" 
ON "tenant_permission_grants"("expiresAt") 
WHERE "revokedAt" IS NULL AND "expiresAt" IS NOT NULL;

-- ============================================================================
-- 9. Create View for Active Tenant Permissions
-- ============================================================================

CREATE OR REPLACE VIEW "active_tenant_permissions" AS
SELECT 
    t.id AS "tenantId",
    t.name AS "tenantName",
    tpg."permissionId",
    tpg."grantedBy",
    tpg."grantedAt",
    tpg."expiresAt",
    tpg."conditions"
FROM "tenants" t
LEFT JOIN "tenant_permission_grants" tpg ON t.id = tpg."tenantId"
WHERE tpg."revokedAt" IS NULL 
  AND (tpg."expiresAt" IS NULL OR tpg."expiresAt" > CURRENT_TIMESTAMP)
  AND t."isDeleted" = false;

COMMENT ON VIEW "active_tenant_permissions" IS 'View of currently active permission grants for all tenants';

-- ============================================================================
-- 10. Create Function to Apply Permission Template to Tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_permission_template_to_tenant(
    template_id TEXT,
    tenant_id TEXT,
    granted_by TEXT
)
RETURNS void AS $$
DECLARE
    template_permissions JSONB;
    perm_id TEXT;
BEGIN
    -- Get template permissions
    SELECT "permissions" INTO template_permissions
    FROM "permission_templates"
    WHERE "id" = template_id AND "isActive" = true AND "isDeleted" = false;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Permission template not found or inactive';
    END IF;
    
    -- Remove existing permission grants for this tenant
    DELETE FROM "tenant_permission_grants"
    WHERE "tenantId" = tenant_id;
    
    -- Grant each permission from template
    FOR perm_id IN SELECT jsonb_array_elements_text(template_permissions)
    LOOP
        INSERT INTO "tenant_permission_grants" ("id", "tenantId", "permissionId", "grantedBy", "grantedAt")
        VALUES (gen_random_uuid(), tenant_id, perm_id, granted_by, CURRENT_TIMESTAMP)
        ON CONFLICT ("tenantId", "permissionId") 
        DO UPDATE SET 
            "grantedBy" = EXCLUDED."grantedBy",
            "grantedAt" = CURRENT_TIMESTAMP,
            "revokedAt" = NULL,
            "revokedBy" = NULL;
    END LOOP;
    
    -- Update tenant permission pool
    UPDATE "tenants"
    SET "permissionPool" = template_permissions,
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = tenant_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION apply_permission_template_to_tenant IS 'Applies a permission template to a tenant, replacing existing grants';

-- ============================================================================
-- Migration Complete
-- ============================================================================