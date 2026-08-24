-- CRM Database Migration Script
-- This script should be run against the BuildX database
-- Usage: psql -h 127.0.0.1 -p 5432 -U postgres -d BuildX -f crm-migration.sql

-- ============================================================================
-- 1. Create Organization Table in CRM Database
-- ============================================================================

CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "code" TEXT,
    "email" TEXT,
    "mobile" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT NOT NULL DEFAULT 'India',
    "pincode" TEXT,
    "gstNumber" TEXT,
    "panNumber" TEXT,
    "website" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "maxUsers" INTEGER NOT NULL DEFAULT 25,
    "maxStorageGb" INTEGER NOT NULL DEFAULT 10,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "settings" JSONB,
    "permissionPool" JSONB,
    "roleHierarchyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxRoleDepth" INTEGER NOT NULL DEFAULT 5,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints for Organization
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key" ON "organizations"("slug") WHERE "slug" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_code_key" ON "organizations"("code") WHERE "code" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_email_key" ON "organizations"("email") WHERE "email" IS NOT NULL;

-- Create indexes for Organization
CREATE INDEX IF NOT EXISTS "organizations_status_idx" ON "organizations"("status");
CREATE INDEX IF NOT EXISTS "organizations_email_idx" ON "organizations"("email");
CREATE INDEX IF NOT EXISTS "organizations_name_idx" ON "organizations"("name");
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX IF NOT EXISTS "organizations_code_idx" ON "organizations"("code");
CREATE INDEX IF NOT EXISTS "organizations_isDeleted_idx" ON "organizations"("isDeleted");
CREATE INDEX IF NOT EXISTS "organizations_createdAt_idx" ON "organizations"("createdAt");

-- ============================================================================
-- 2. Update User Table in CRM Database
-- ============================================================================

-- Add permission tracking fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'permissionVersion'
    ) THEN
        ALTER TABLE "users"
        ADD COLUMN "permissionVersion" INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN "effectivePermissions" JSONB,
        ADD COLUMN "lastPermissionCalculation" TIMESTAMP(3);
    END IF;
END $$;

-- Create index on role if it doesn't exist
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- ============================================================================
-- 3. Update Role Table in CRM Database
-- ============================================================================

-- Add role hierarchy support if fields don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'roles' AND column_name = 'code'
    ) THEN
        ALTER TABLE "roles"
        ADD COLUMN "code" TEXT,
        ADD COLUMN "permissionIds" JSONB,
        ADD COLUMN "inheritsFromId" TEXT,
        ADD COLUMN "level" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Create unique constraint for code
CREATE UNIQUE INDEX IF NOT EXISTS "roles_organizationId_code_key" ON "roles"("organizationId", "code") WHERE "code" IS NOT NULL;

-- Create index for role hierarchy
CREATE INDEX IF NOT EXISTS "roles_inheritsFromId_idx" ON "roles"("inheritsFromId");

-- Add foreign key for role hierarchy if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'roles_inheritsFromId_fkey'
    ) THEN
        ALTER TABLE "roles"
        ADD CONSTRAINT "roles_inheritsFromId_fkey"
        FOREIGN KEY ("inheritsFromId") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 4. Update Permission Table in CRM Database
-- ============================================================================

-- Add action field for granular permissions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'permissions' AND column_name = 'action'
    ) THEN
        ALTER TABLE "permissions"
        ADD COLUMN "action" TEXT;
    END IF;
END $$;

-- Create index on action
CREATE INDEX IF NOT EXISTS "permissions_action_idx" ON "permissions"("action");

-- ============================================================================
-- 5. Create RolePermission Table in CRM Database
-- ============================================================================

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedById" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- Create indexes for RolePermission
CREATE INDEX IF NOT EXISTS "role_permissions_roleId_idx" ON "role_permissions"("roleId");
CREATE INDEX IF NOT EXISTS "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- Add foreign keys for RolePermission if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'role_permissions_roleId_fkey'
    ) THEN
        ALTER TABLE "role_permissions"
        ADD CONSTRAINT "role_permissions_roleId_fkey"
        FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "role_permissions_permissionId_fkey"
        FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 6. Update UserRole Table in CRM Database
-- ============================================================================

-- Add proper foreign key to Organization if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_roles_organizationId_fkey'
    ) THEN
        ALTER TABLE "user_roles"
        ADD CONSTRAINT "user_roles_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 7. Update Session Table in CRM Database
-- ============================================================================

-- Add foreign key to User with CASCADE if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'sessions_userId_fkey'
    ) THEN
        ALTER TABLE "sessions"
        ADD CONSTRAINT "sessions_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 8. Update RefreshToken Table in CRM Database
-- ============================================================================

-- Add foreign keys with CASCADE if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'refresh_tokens_sessionId_fkey'
    ) THEN
        ALTER TABLE "refresh_tokens"
        ADD CONSTRAINT "refresh_tokens_sessionId_fkey"
        FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT "refresh_tokens_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 9. Update OrganizationModule Table in CRM Database
-- ============================================================================

-- Add module grant tracking fields if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'organization_modules' AND column_name = 'grantedBy'
    ) THEN
        ALTER TABLE "organization_modules"
        ADD COLUMN "grantedBy" TEXT,
        ADD COLUMN "permissionSet" JSONB;
    END IF;
END $$;

-- Add foreign key to Organization with CASCADE if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'organization_modules_organizationId_fkey'
    ) THEN
        ALTER TABLE "organization_modules"
        ADD CONSTRAINT "organization_modules_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- Add Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN "users"."permissionVersion" IS 'Track permission changes to invalidate caches';
COMMENT ON COLUMN "users"."effectivePermissions" IS 'Cached effective permissions for performance';
COMMENT ON COLUMN "users"."lastPermissionCalculation" IS 'Timestamp when effective permissions were last calculated';
COMMENT ON COLUMN "roles"."inheritsFromId" IS 'Parent role ID for role hierarchy support';
COMMENT ON COLUMN "roles"."level" IS 'Hierarchy level for role inheritance depth calculation';
COMMENT ON COLUMN "organization_modules"."grantedBy" IS 'Super Admin who granted this module to the organization';
COMMENT ON COLUMN "organization_modules"."permissionSet" IS 'Specific permissions granted for this module';

-- ============================================================================
-- Migration Complete
-- ============================================================================
