/**
 * CRM provisioning constants.
 *
 * Mirrors the CRM backend's SYSTEM_ROLE_DEFS (ADMIN-CRM
 * src/common/system-seed.constants.ts) so that tenant creation can provision
 * the CRM Organization + system roles in one step. The CRM backend's
 * RoleSyncService reconciles these roles on every CRM restart, so any drift in
 * this mirror self-heals — keep the permission arrays in sync with the CRM.
 */

export const CRM_SYSTEM_ROLES = [
  { name: 'Owner', code: 'OWNER', permissions: ['*'] as string[] },
  {
    name: 'Admin',
    code: 'ADMIN',
    permissions: [
      'dashboard:view',
      'lead:list',
      'lead:read',
      'lead:create',
      'lead:update',
      'lead:delete',
      'lead:restore',
      'customer:list',
      'customer:read',
      'customer:create',
      'customer:update',
      'customer:delete',
      'customer:restore',
      'project:list',
      'project:read',
      'project:create',
      'project:update',
      'project:delete',
      'project:restore',
      'item-master:list',
      'item-master:read',
      'item-master:create',
      'item-master:update',
      'item-master:delete',
      'inventory:list',
      'inventory:read',
      'inventory:create',
      'inventory:update',
      'inventory:delete',
      'user:list',
      'user:read',
      'user:create',
      'user:update',
      'role:list',
      'role:read',
      'organization:list',
      'organization:read',
      'organization:update',
      'tracking:read',
      'tracking:update',
      'purchase-order:approve',
      'task:list',
      'task:read',
      'task:create',
      'task:update',
      'task:delete',
      'system:read',
    ],
  },
  {
    name: 'Employee',
    code: 'EMPLOYEE',
    permissions: [
      'dashboard:view',
      'lead:list',
      'lead:read',
      'lead:create',
      'lead:update',
      'customer:list',
      'customer:read',
      'customer:create',
      'customer:update',
      'project:list',
      'project:read',
      'project:update',
      'item-master:list',
      'item-master:read',
      'item-master:create',
      'item-master:update',
      'inventory:list',
      'inventory:read',
      'inventory:create',
      'inventory:update',
      'tracking:read',
      'tracking:update',
      'task:list',
      'task:read',
      'task:create',
      'task:update',
      'system:read',
    ],
  },
];

/** Canonical (singular) CRM module keys enabled by default for new tenants. */
export const CRM_DEFAULT_MODULES = [
  'dashboard',
  'lead',
  'customer',
  'project',
  'item-master',
  'inventory',
  'vendor',
  'purchase-order',
  'task',
  'user',
  'role',
  'organization',
  'tracking',
  'document',
  'report',
  'warehouse',
  'system',
];

/**
 * Full CRM permission catalog, grouped by module.
 *
 * Mirrors the CRM backend's PERMISSIONS constant
 * (ADMIN-CRM/src/common/constants/permissions.constants.ts) so the platform
 * can render an editable permission matrix without hardcoding per-tenant data.
 * Keep in sync with the CRM's PERMISSIONS constant — the CRM guard reads the
 * keys themselves, so adding a key here only affects what the matrix shows.
 */
export const CRM_PERMISSION_CATALOG: Record<string, string[]> = {
  dashboard: ['dashboard:view'],
  lead: ['lead:list', 'lead:read', 'lead:create', 'lead:update', 'lead:delete', 'lead:restore'],
  customer: [
    'customer:list',
    'customer:read',
    'customer:create',
    'customer:update',
    'customer:delete',
    'customer:restore',
  ],
  project: [
    'project:list',
    'project:read',
    'project:create',
    'project:update',
    'project:delete',
    'project:restore',
  ],
  'item-master': [
    'item-master:list',
    'item-master:read',
    'item-master:create',
    'item-master:update',
    'item-master:delete',
  ],
  inventory: [
    'inventory:list',
    'inventory:read',
    'inventory:create',
    'inventory:update',
    'inventory:delete',
  ],
  vendor: ['vendor:list', 'vendor:read', 'vendor:create', 'vendor:update', 'vendor:delete'],
  'purchase-order': [
    'purchase-order:list',
    'purchase-order:read',
    'purchase-order:create',
    'purchase-order:update',
    'purchase-order:delete',
    'purchase-order:approve',
  ],
  user: ['user:list', 'user:read', 'user:create', 'user:update', 'user:delete'],
  role: ['role:list', 'role:read', 'role:create', 'role:update', 'role:delete'],
  organization: [
    'organization:list',
    'organization:read',
    'organization:create',
    'organization:update',
    'organization:delete',
  ],
  tracking: ['tracking:read', 'tracking:update'],
  document: ['document:list'],
  task: ['task:list', 'task:read', 'task:create', 'task:update', 'task:delete'],
  system: ['system:read'],
};
