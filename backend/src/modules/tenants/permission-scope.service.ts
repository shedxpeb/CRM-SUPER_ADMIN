import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CRM_PERMISSION_CATALOG } from './crm-provisioning.constants';
import type { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { TenantPermissionPoolConfig } from './dto/tenant-permission-pool.dto';
import { TenantTier } from './dto/tenant-permission-pool.dto';

/**
 * PermissionScopeService manages tenant-level permission boundaries.
 *
 * This service enforces the authorization hierarchy:
 * SUPER_ADMIN → TENANT PERMISSION SCOPE → ADMIN → ROLE → USER
 *
 * Key concepts:
 * - Tenant Permission Pool: Maximum CRM permissions a tenant/admin can manage
 * - Actor Scope: Permissions the current actor is authorized to grant
 * - Permission validation: Ensures grants respect parent boundaries
 */
@Injectable()
export class PermissionScopeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get a tenant's permission pool configuration.
   */
  async getTenantPermissionPool(tenantId: string): Promise<TenantPermissionPoolConfig> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { permissionPool: true },
    });

    if (!tenant) {
      throw new BadRequestException('Tenant not found');
    }

    // If no pool is set, default to all permissions (backward compatibility)
    if (!tenant.permissionPool) {
      return this.getDefaultPermissionPool();
    }

    // Validate the pool structure
    const pool = tenant.permissionPool as unknown;
    if (typeof pool === 'object' && pool !== null && 'allowedPermissions' in pool) {
      return pool as TenantPermissionPoolConfig;
    }

    // If structure is invalid, return default
    return this.getDefaultPermissionPool();
  }

  /**
   * Set a tenant's permission pool (Super Admin only).
   */
  async setTenantPermissionPool(
    tenantId: string,
    config: TenantPermissionPoolConfig,
    actor: CurrentUser,
  ): Promise<void> {
    // Validate all permissions exist in the CRM catalog
    const allPermissions = this.getAllCrmPermissions();
    const invalidPermissions = [
      ...config.allowedPermissions,
      ...(config.deniedPermissions || []),
    ].filter((p) => !allPermissions.includes(p));

    if (invalidPermissions.length > 0) {
      throw new BadRequestException(`Unknown CRM permission(s): ${invalidPermissions.join(', ')}`);
    }

    // Validate denied permissions are not also in allowed
    const deniedSet = new Set(config.deniedPermissions || []);
    const overlap = config.allowedPermissions.filter((p) => deniedSet.has(p));
    if (overlap.length > 0) {
      throw new BadRequestException(
        `Permissions cannot be both allowed and denied: ${overlap.join(', ')}`,
      );
    }

    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        permissionPool: config as unknown,
        poolModifiedById: actor.id,
        poolModifiedAt: new Date(),
      },
    });
  }

  /**
   * Validate that permissions are within the tenant's permission pool.
   */
  async validatePermissionsInPool(tenantId: string, permissions: string[]): Promise<void> {
    const pool = await this.getTenantPermissionPool(tenantId);
    const allowedSet = new Set(pool.allowedPermissions);
    const deniedSet = new Set(pool.deniedPermissions || []);

    const invalidPermissions = permissions.filter((p) => !allowedSet.has(p) || deniedSet.has(p));

    if (invalidPermissions.length > 0) {
      throw new ForbiddenException(
        `Permissions outside tenant scope: ${invalidPermissions.join(', ')}`,
      );
    }
  }

  /**
   * Validate that the actor can grant specific permissions.
   *
   * Rules:
   * 1. Actor must have platform permission 'permissions:manage'
   * 2. Actor's platform role must allow managing tenant permissions
   * 3. For Super Admin: can grant any permission within tenant's pool
   * 4. For others: can only grant permissions they themselves have
   */
  async validateActorCanGrant(
    actor: CurrentUser,
    tenantId: string,
    permissions: string[],
  ): Promise<void> {
    // Check if actor is Super Admin (has wildcard)
    if (actor.permissions.includes('*')) {
      // Super Admins can grant any permission within tenant's pool
      await this.validatePermissionsInPool(tenantId, permissions);
      return;
    }

    // Check if actor has platform permission to manage permissions
    if (!actor.permissions.includes('permissions:manage')) {
      throw new ForbiddenException('Insufficient permissions to manage permissions');
    }

    // For non-Super Admins, validate that actor has the permissions they're trying to grant
    // This prevents privilege escalation
    const missingPermissions = permissions.filter((p) => !actor.permissions.includes(p));
    if (missingPermissions.length > 0) {
      throw new ForbiddenException(
        `Cannot grant permissions you do not have: ${missingPermissions.join(', ')}`,
      );
    }

    // Also validate against tenant pool
    await this.validatePermissionsInPool(tenantId, permissions);
  }

  /**
   * Get manageable permissions for an actor within a tenant context.
   *
   * Returns the intersection of:
   * - Tenant's permission pool
   * - Actor's platform permissions (for non-Super Admins)
   */
  async getManageablePermissions(tenantId: string, actor: CurrentUser): Promise<string[]> {
    const pool = await this.getTenantPermissionPool(tenantId);
    const deniedSet = new Set(pool.deniedPermissions || []);

    // Super Admin gets all permissions in pool
    if (actor.permissions.includes('*')) {
      return pool.allowedPermissions.filter((p) => !deniedSet.has(p));
    }

    // Other actors get intersection of their permissions and pool
    const actorSet = new Set(actor.permissions);
    return pool.allowedPermissions.filter((p) => actorSet.has(p) && !deniedSet.has(p));
  }

  /**
   * Get manageable permissions grouped by module (for UI).
   */
  async getManageablePermissionCatalog(
    tenantId: string,
    actor: CurrentUser,
  ): Promise<Record<string, string[]>> {
    const manageable = await this.getManageablePermissions(tenantId, actor);
    const manageableSet = new Set(manageable);

    const result: Record<string, string[]> = {};

    for (const [module, permissions] of Object.entries(CRM_PERMISSION_CATALOG)) {
      const modulePermissions = permissions.filter((p) => manageableSet.has(p));
      if (modulePermissions.length > 0) {
        result[module] = modulePermissions;
      }
    }

    return result;
  }

  /**
   * Get the default permission pool (all CRM permissions).
   * Used for backward compatibility with existing tenants.
   */
  private getDefaultPermissionPool(): TenantPermissionPoolConfig {
    return {
      allowedPermissions: this.getAllCrmPermissions(),
      tier: 'standard' as TenantTier,
      allowCustomRoles: true,
      allowUserOverrides: true,
    };
  }

  /**
   * Get all CRM permission keys as a flat array.
   */
  private getAllCrmPermissions(): string[] {
    const allPermissions: string[] = [];
    for (const permissions of Object.values(CRM_PERMISSION_CATALOG)) {
      allPermissions.push(...permissions);
    }
    return allPermissions;
  }
}
