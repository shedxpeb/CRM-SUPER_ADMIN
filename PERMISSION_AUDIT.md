# Permission System Audit - Current State

## STEP 1: Canonical Permission Catalog Audit

### Platform Permissions (Super Admin)
**Database:** `peb-platform`
**Table:** `Permission`
**Source:** `backend/prisma/seed.ts`

**Catalog:**
- Tenants: organization:read/create/update/suspend/restore/delete
- RBAC: users:read/manage, roles:read/manage, permissions:read/manage
- Modules: modules:manage
- Monitoring: monitoring:read, health:read, errors:read/resolve, audit:read, logs:read
- Security: security:read/manage
- Settings: settings:read/manage

**Format:** `module:action` (e.g., `organization:read`)

### CRM Permissions (Tenant)
**Database:** `peb-crm`
**Table:** `Permission` (per-organization)
**Source:** `backend/src/modules/tenants/crm-provisioning.constants.ts`

**Catalog (14 modules):**
- dashboard: dashboard:view
- lead: lead:list, lead:read, lead:create, lead:update, lead:delete, lead:restore
- customer: customer:list, customer:read, customer:create, customer:update, customer:delete, customer:restore
- project: project:list, project:read, project:create, project:update, project:delete, project:restore
- item-master: item-master:list, item-master:read, item-master:create, item-master:update, item-master:delete
- inventory: inventory:list, inventory:read, inventory:create, inventory:update, inventory:delete
- vendor: vendor:list, vendor:read, vendor:create, vendor:update, vendor:delete
- purchase-order: purchase-order:list, purchase-order:read, purchase-order:create, purchase-order:update, purchase-order:delete, purchase-order:approve
- finance: finance:list, finance:read, finance:create, finance:update, finance:delete, finance:approve
- user: user:list, user:read, user:create, user:update, user:delete
- role: role:list, role:read, role:create, role:update, role:delete
- organization: organization:list, organization:read, organization:create, organization:update, organization:delete
- tracking: tracking:read, tracking:update
- document: document:list
- task: task:list, task:read, task:create, task:update, task:delete
- system: system:read

**Format:** `module:action` (e.g., `finance:approve`)

### Existing Structures

#### Platform Database
1. **Tenant.permissionPool** (JSON)
   - Exists in schema
   - Currently unused for validation
   - Intended for delegated permissions

2. **TenantPermissionGrant** (Table)
   - Fields: id, tenantId, permissionId, grantedBy, grantedAt, expiresAt, revokedAt, revokedBy, conditions
   - Currently unused
   - **Issue:** `permissionId` references platform Permission table, but CRM permissions are in separate database

#### CRM Database
1. **Organization.permissionPool** (JSON)
   - Exists in schema
   - Used during provisioning to store all CRM permissions as flat array
   - Not used for validation

2. **PermissionDelegation** (Table)
   - Exists in schema
   - Currently unused
   - Designed for temporary permission grants with expiration

### Current Permission Flow

**Platform:**
```
PlatformUser → PlatformUserRole → PlatformRole → RolePermission → Permission
```

**CRM:**
```
User → UserRoleAssignment → Role → RolePermission → Permission
User → UserPermission (overrides)
User → UserModuleAccess (module overrides)
```

### Current Issues

1. **No Tenant Scope Enforcement**
   - Super Admin can grant ANY CRM permission to ANY tenant
   - No validation in `setTenantRolePermissions`
   - No validation in `setTenantUserPermissions`

2. **Permission ID vs Key Mismatch**
   - `TenantPermissionGrant.permissionId` references platform Permission table
   - CRM permissions are in separate database with different Permission table
   - Cannot directly reference CRM permissions via foreign key

3. **Unused Tables**
   - `TenantPermissionGrant` - unused
   - `PermissionDelegation` - unused
   - `Tenant.permissionPool` - stored but not validated

4. **No Parent Authorization Chain**
   - Platform permissions and CRM permissions are independent
   - No validation that actor can grant specific permissions

### Role Hierarchy

**CRM Schema:**
- `Role.inheritsFromId` - for role hierarchy
- `Role.level` - hierarchy level
- `Organization.maxRoleDepth` - maximum depth (default 5)
- `Tenant.maxRoleDepth` - maximum depth (default 5)

**Current State:**
- Inheritance is calculated in `getEffectivePermissionsForUser`
- No cycle detection when creating/updating roles
- No depth validation when creating/updating roles

### Effective Permission Calculation

**Current Implementation** (tenant-ops.service.ts:791-919):
1. SUPER_ADMIN/OWNER get wildcard `*`
2. Collect role permissions (including inherited)
3. Apply user permission overrides (granted added, denied removed)
4. Apply module restrictions from OrganizationModule and UserModuleAccess
5. Return final effective permissions

**Missing:**
- Tenant permission scope filtering
- Parent authorization validation
