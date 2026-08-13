/**
 * Centralized Permission Constants
 *
 * Single source of truth for all permission strings.
 * Use these constants instead of hardcoded strings to ensure consistency.
 */

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_READ: 'dashboard:read',

  // Organization (Tenant)
  ORGANIZATION_READ: 'organization:read',
  ORGANIZATION_CREATE: 'organization:create',
  ORGANIZATION_UPDATE: 'organization:update',
  ORGANIZATION_DELETE: 'organization:delete',
  ORGANIZATION_RESTORE: 'organization:restore',
  ORGANIZATION_SUSPEND: 'organization:suspend',
  ORGANIZATION_IMPERSONATE: 'organization:impersonate',

  // Users
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  USERS_CREATE: 'users:create',
  USERS_UPDATE: 'users:update',

  // Roles
  ROLES_READ: 'roles:read',
  ROLES_MANAGE: 'roles:manage',

  // RBAC
  RBAC_READ: 'rbac:read',
  RBAC_MANAGE: 'rbac:manage',

  // Security
  SECURITY_READ: 'security:read',
  SECURITY_MANAGE: 'security:manage',

  // Monitoring
  MONITORING_READ: 'monitoring:read',

  // Audit
  AUDIT_READ: 'audit:read',

  // Tenants
  TENANTS_READ: 'tenants:read',
  TENANTS_MANAGE: 'tenants:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
