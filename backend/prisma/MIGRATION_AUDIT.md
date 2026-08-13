# Platform Migration Audit Report

## Date: 2025-01-13

## Summary
Platform migration blocker has been resolved. The CRM migration script was incorrectly placed in the Prisma migrations folder, which could cause confusion or accidental execution against the wrong database.

## Issues Found and Fixed

### 1. CRM Migration Script in Wrong Location
**Issue**: `prisma/crm-migration.sql` was located in the Prisma migrations folder, which is exclusively for Platform DB migrations.

**Fix**: 
- Moved CRM migration script to `sql-scripts/crm-migration.sql`
- Added README.md with clear usage instructions
- Updated original file with redirect notice

**Impact**: Prevents accidental execution of CRM migration against Platform DB

## Platform Migrations Status

### Migration: 20260813000001_add_sync_tracking
**Status**: ✅ CLEAN - Platform DB Only

**Scope**:
- Adds sync tracking fields to `tenants` table in Platform DB:
  - `lastSyncedAt` (TIMESTAMP)
  - `syncError` (TEXT)
  - `syncVersion` (INTEGER)
- Creates indexes for sync monitoring
- Adds UUID check constraint for `crmOrganizationId`
- Creates function `reset_stuck_sync_states()`
- Creates view `tenant_sync_status`

**Verification**:
- ✅ Only targets Platform DB tables (tenants)
- ✅ Does NOT touch CRM tables
- ✅ Uses idempotent IF NOT EXISTS checks
- ✅ Schema.prisma already includes these fields (lines 296-299)

### Migration: 20260812000000_enhance_tenant_permissions
**Status**: ✅ CLEAN - Platform DB Only

**Scope**:
- Enhances Tenant model with permission management
- Creates `permission_templates` table
- Creates `tenant_permission_grants` table
- Adds permission-related functions and views

**Verification**:
- ✅ Only targets Platform DB tables
- ✅ Does NOT touch CRM tables

### Migration: 20260811200000_remove_saas_modules
**Status**: ✅ CLEAN - Platform DB Only

**Scope**:
- Removes SaaS/billing related tables from Platform DB
- Simplifies Tenant model by removing subscription fields

**Verification**:
- ✅ Only targets Platform DB tables
- ✅ Does NOT touch CRM tables

### Migration: 20260807110855_init
**Status**: ✅ CLEAN - Platform DB Only

**Scope**:
- Initial Platform DB schema
- Creates all Platform DB tables

**Verification**:
- ✅ Only targets Platform DB tables
- ✅ Does NOT touch CRM tables

## Database Separation

### Platform DB (`peb-platform`)
- **Purpose**: Super Admin control plane
- **Tables**: platform_users, tenants, platform_roles, permissions, etc.
- **Migrations**: Prisma migrations in `prisma/migrations/`
- **Schema**: `prisma/schema.prisma`

### CRM DB (`peb-crm`)
- **Purpose**: Multi-tenant CRM application
- **Tables**: organizations, users, roles, permissions, etc.
- **Migrations**: Manual SQL scripts in `sql-scripts/`
- **Schema**: `prisma/crm-schema.prisma` (for reference only)

## Cross-Database References

The only cross-database reference is:
- `Tenant.crmOrganizationId` in Platform DB → `Organization.id` in CRM DB
- This is a logical link, NOT a foreign key constraint
- Maintained via UUID check constraint to ensure valid format

## Next Steps

1. Run Platform migrations against Platform DB:
   ```bash
   cd SUPER-ADMIN/backend
   npx prisma migrate deploy
   ```

2. Run CRM migration against CRM DB (if needed):
   ```bash
   psql -h 127.0.0.1 -p 5432 -U postgres -d peb-crm -f sql-scripts/crm-migration.sql
   ```

3. Regenerate Prisma client:
   ```bash
   npx prisma generate
   ```

4. Verify migration status:
   ```bash
   npx prisma migrate status
   ```

## Conclusion

✅ Migration blocker resolved
✅ Platform migrations are clean and Platform DB only
✅ CRM migration script moved to correct location
✅ Database separation properly maintained
✅ No CRM table modifications in Platform migrations
