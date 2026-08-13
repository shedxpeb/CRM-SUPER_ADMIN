import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { CrmPrismaService } from '../../database/crm-prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  AssignTenantUserRoleDto,
  CreateTenantRoleDto,
  CreateTenantUserDto,
  ResetTenantUserPasswordDto,
  SetTenantRolePermissionsDto,
  SetTenantUserActiveDto,
  UpdateTenantRoleDto,
  UpdateTenantUserDto,
} from './dto/tenant-crm.dto';

const DEFAULT_CRM_ROLE = 'EMPLOYEE';

async function ensureTenant(
  prisma: PrismaService,
  tenantId: string,
): Promise<{ id: string; crmOrganizationId: string; name: string }> {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');
  if (!tenant.crmOrganizationId) {
    throw new BadRequestException('Tenant is not linked to a CRM organization');
  }
  return { id: tenant.id, crmOrganizationId: tenant.crmOrganizationId, name: tenant.name };
}

@Injectable()
export class TenantOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmPrisma: CrmPrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Activity / Impersonations / Modules ─────────────────────────────────────

  async getActivity(tenantId: string, dto: PaginationDto) {
    await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(dto);
    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.prisma.platformAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          actorId: true,
          actorEmail: true,
          action: true,
          targetType: true,
          targetId: true,
          targetName: true,
          severity: true,
          ipAddress: true,
          correlationId: true,
          requestId: true,
          createdAt: true,
        },
      }),
      this.prisma.platformAuditLog.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async getImpersonations(tenantId: string, dto: PaginationDto) {
    await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(dto);
    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.prisma.impersonationLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          superAdminId: true,
          superAdminEmail: true,
          tenantId: true,
          targetUserId: true,
          targetUserEmail: true,
          reason: true,
          grantId: true,
          startedAt: true,
          endedAt: true,
          durationSeconds: true,
          endedBy: true,
        },
      }),
      this.prisma.impersonationLog.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async getModules(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        modulesEnabled: true,
        moduleOverrides: { select: { moduleKey: true, enabled: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const enabledModules = (tenant.modulesEnabled as string[]) || [];
    const overrides = tenant.moduleOverrides.reduce(
      (acc, o) => {
        acc[o.moduleKey] = o.enabled;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    const base = enabledModules.reduce((acc, m) => ({ ...acc, [m]: true }), {});
    return Object.keys(overrides).length > 0 ? overrides : base;
  }

  async updateModules(tenantId: string, modules: Record<string, boolean>, actorId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');

    const validModules = [
      'dashboard',
      'leads',
      'customers',
      'projects',
      'vendors',
      'inventory',
      'warehouse',
      'purchases',
      'tracking',
      'reports',
      'users',
      'roles',
    ];

    const invalidModules = Object.keys(modules).filter((m) => !validModules.includes(m));
    if (invalidModules.length > 0) {
      throw new BadRequestException(`Invalid module keys: ${invalidModules.join(', ')}`);
    }

    // Store previous state for compensating transaction
    const previousModules = tenant.modulesEnabled as string[] || [];
    const previousOverrides = await this.prisma.tenantModuleOverride.findMany({
      where: { tenantId },
      select: { moduleKey: true, enabled: true },
    });

    try {
      // Step 1: Update Platform DB in a transaction (Tenant.modulesEnabled + TenantModuleOverride)
      await this.prisma.$transaction(async (platformTx) => {
        const updates = Object.entries(modules).map(([moduleKey, enabled]) =>
          platformTx.tenantModuleOverride.upsert({
            where: { tenantId_moduleKey: { tenantId, moduleKey } },
            update: { enabled, setById: actorId, updatedAt: new Date() },
            create: { tenantId, moduleKey, enabled, setById: actorId },
          }),
        );
        await Promise.all(updates);

        const enabledModuleKeys = Object.entries(modules)
          .filter(([, enabled]) => enabled)
          .map(([key]) => key);

        await platformTx.tenant.update({
          where: { id: tenantId },
          data: { modulesEnabled: enabledModuleKeys, updatedById: actorId },
        });
      });

      // Step 2: Update CRM OrganizationModule via crmPrisma (compensating transaction)
      if (tenant.crmOrganizationId) {
        try {
          await this.crmPrisma.$transaction(async (crmTx) => {
            const crmUpdates = Object.entries(modules).map(([moduleKey, enabled]) =>
              crmTx.organizationModule.upsert({
                where: {
                  organizationId_moduleKey: { organizationId: tenant.crmOrganizationId!, moduleKey },
                },
                update: {
                  enabled,
                  configuredById: actorId,
                  updatedAt: new Date(),
                  disabledAt: enabled ? null : new Date(),
                  enabledAt: enabled ? new Date() : undefined,
                },
                create: {
                  organizationId: tenant.crmOrganizationId!,
                  moduleKey,
                  enabled,
                  configuredById: actorId,
                  enabledAt: enabled ? new Date() : undefined,
                  disabledAt: enabled ? null : new Date(),
                },
              }),
            );
            await Promise.all(crmUpdates);

            // Step 3: When modules are disabled, remove module-specific permissions from non-system roles
            const disabledModules = Object.entries(modules)
              .filter(([, enabled]) => !enabled)
              .map(([key]) => key);

            if (disabledModules.length > 0 && tenant.crmOrganizationId) {
              const roles = await crmTx.role.findMany({
                where: {
                  organizationId: tenant.crmOrganizationId,
                  isDeleted: false,
                  isSystem: false,
                },
              });

              for (const role of roles) {
                const currentPermissions = role.permissions || [];
                const filteredPermissions = currentPermissions.filter((perm: string) => {
                  const module = perm.split(':')[0];
                  return !disabledModules.includes(module);
                });

                if (filteredPermissions.length !== currentPermissions.length) {
                  await crmTx.role.update({
                    where: { id: role.id },
                    data: { permissions: filteredPermissions },
                  });
                }
              }
            }
          });
        } catch (error) {
          // Compensating transaction: Revert Platform DB if CRM update fails
          await this.prisma.$transaction(async (platformTx) => {
            // Revert Tenant.modulesEnabled
            await platformTx.tenant.update({
              where: { id: tenantId },
              data: {
                modulesEnabled: previousModules,
                syncError: 'Failed to sync module updates to CRM',
                updatedById: actorId,
              },
            });

            // Revert TenantModuleOverride to previous state
            for (const override of previousOverrides) {
              await platformTx.tenantModuleOverride.upsert({
                where: { tenantId_moduleKey: { tenantId, moduleKey: override.moduleKey } },
                update: { enabled: override.enabled, setById: actorId, updatedAt: new Date() },
                create: { tenantId, moduleKey: override.moduleKey, enabled: override.enabled, setById: actorId },
              });
            }

            // Remove any new overrides that didn't exist before
            const previousModuleKeys = new Set(previousOverrides.map(o => o.moduleKey));
            const currentOverrides = await platformTx.tenantModuleOverride.findMany({
              where: { tenantId },
            });
            for (const current of currentOverrides) {
              if (!previousModuleKeys.has(current.moduleKey)) {
                await platformTx.tenantModuleOverride.delete({
                  where: { tenantId_moduleKey: { tenantId, moduleKey: current.moduleKey } },
                });
              }
            }
          });
          throw new BadRequestException('Failed to update CRM modules. Platform modules reverted to previous state.');
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Failed to update platform tenant modules');
    }

    // Step 4: Create audit log entry
    await this.auditService.record({
      actorId: actorId,
      actorEmail: 'super-admin',
      action: 'tenant.modules.update',
      targetType: 'Tenant',
      targetId: tenantId,
      targetName: tenant.name,
      metadata: { modules, crmOrganizationId: tenant.crmOrganizationId },
      severity: 'INFO',
    });

    return this.getModules(tenantId);
  }

  // ── Tenant users (CRM User) ─────────────────────────────────────────────────

  async getTenantUsers(tenantId: string, query: PaginationDto) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(query);

    const where = {
      organizationId: tenant.crmOrganizationId,
      isDeleted: false,
    } as Record<string, unknown>;
    if (query.q) {
      where.OR = [
        { email: { contains: query.q, mode: 'insensitive' as const } },
        { name: { contains: query.q, mode: 'insensitive' as const } },
      ];
    }

    const [items, total] = await Promise.all([
      this.crmPrisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isVerified: true,
          isLocked: true,
          lastLogin: true,
          department: true,
          designation: true,
          mobile: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.crmPrisma.user.count({ where }),
    ]);

    return { items, meta: buildPageMeta(page, take, total, undefined) };
  }

  async getTenantUser(tenantId: string, userId: string) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        isVerified: true,
        isLocked: true,
        lastLogin: true,
        department: true,
        designation: true,
        mobile: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Tenant user not found');
    return user;
  }

  async createTenantUser(
    tenantId: string,
    dto: CreateTenantUserDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);

    const existing = await this.crmPrisma.user.findFirst({
      where: { email: dto.email, isDeleted: false },
    });
    if (existing) throw new ConflictException('A user with this email already exists');

    const role = dto.role?.toUpperCase() || DEFAULT_CRM_ROLE;
    const password = this.generateTemporaryPassword();

    const user = await this.crmPrisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        name: dto.name,
        mobile: dto.mobile,
        department: dto.department,
        designation: dto.designation,
        role,
        organizationId: tenant.crmOrganizationId,
        password: await bcrypt.hash(password, 10),
        isActive: dto.isActive ?? true,
        isVerified: true,
        version: 1,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.create',
      targetType: 'User',
      targetId: user.id,
      targetName: user.email,
      tenantId,
      metadata: { email: user.email, role: user.role },
    });

    return { ...user, temporaryPassword: password };
  }

  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: UpdateTenantUserDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    const updated = await this.crmPrisma.user.update({
      where: { id: userId },
      data: {
        name: dto.name,
        mobile: dto.mobile,
        department: dto.department,
        designation: dto.designation,
        version: { increment: 1 },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        department: true,
        designation: true,
        mobile: true,
        updatedAt: true,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.update',
      targetType: 'User',
      targetId: userId,
      targetName: updated.email,
      tenantId,
      metadata: { changedFields: Object.keys(dto) },
    });

    return updated;
  }

  async setTenantUserActive(
    tenantId: string,
    userId: string,
    dto: SetTenantUserActiveDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    const updated = await this.crmPrisma.user.update({
      where: { id: userId },
      data: {
        isActive: dto.isActive,
        isLocked: dto.isActive ? false : user.isLocked,
        version: { increment: 1 },
      },
      select: { id: true, email: true, isActive: true },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: dto.isActive ? 'tenant.user.enable' : 'tenant.user.disable',
      targetType: 'User',
      targetId: userId,
      targetName: updated.email,
      tenantId,
      metadata: { isActive: dto.isActive },
    });

    return updated;
  }

  async resetTenantUserPassword(
    tenantId: string,
    userId: string,
    dto: ResetTenantUserPasswordDto | undefined,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    const newPassword = dto?.newPassword || this.generateTemporaryPassword();
    const history = Array.isArray(user.passwordHistory) ? (user.passwordHistory as string[]) : [];

    await this.crmPrisma.user.update({
      where: { id: userId },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        passwordHistory: [...history.slice(-9), user.password],
        failedLoginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.reset_password',
      targetType: 'User',
      targetId: userId,
      targetName: user.email,
      tenantId,
      metadata: { generated: !dto?.newPassword },
    });

    return {
      success: true,
      message: 'Password reset',
      email: user.email,
      temporaryPassword: dto?.newPassword ? undefined : newPassword,
    };
  }

  async forceLogoutTenantUser(
    tenantId: string,
    userId: string,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    await this.crmPrisma.$transaction([
      this.crmPrisma.user.update({
        where: { id: userId },
        data: { version: { increment: 1 } },
      }),
      this.crmPrisma.session.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
      this.crmPrisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.force_logout',
      targetType: 'User',
      targetId: userId,
      targetName: user.email,
      tenantId,
      severity: 'WARNING',
    });

    return { success: true, message: 'All sessions revoked for user' };
  }

  async assignTenantUserRole(
    tenantId: string,
    userId: string,
    dto: AssignTenantUserRoleDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    const role = await this.crmPrisma.role.findFirst({
      where: { id: dto.roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');

    await this.crmPrisma.$transaction([
      this.crmPrisma.userRole.deleteMany({
        where: { userId, organizationId: tenant.crmOrganizationId },
      }),
      this.crmPrisma.userRole.create({
        data: {
          userId,
          roleId: role.id,
          organizationId: tenant.crmOrganizationId,
          assignedById: actor.id,
        },
      }),
      this.crmPrisma.user.update({
        where: { id: userId },
        data: role.code ? { role: role.code, version: { increment: 1 } } : { version: { increment: 1 } },
      }),
    ]);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.assign_role',
      targetType: 'User',
      targetId: userId,
      targetName: user.email,
      tenantId,
      metadata: { roleId: role.id, roleCode: role.code },
    });

    return { success: true, message: `Role ${role.name} assigned` };
  }

  async removeTenantUserRole(
    tenantId: string,
    userId: string,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const user = await this.crmPrisma.user.findFirst({
      where: { id: userId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!user) throw new NotFoundException('Tenant user not found');

    await this.crmPrisma.$transaction([
      this.crmPrisma.userRole.deleteMany({
        where: { userId, organizationId: tenant.crmOrganizationId },
      }),
      this.crmPrisma.user.update({
        where: { id: userId },
        data: { role: DEFAULT_CRM_ROLE, version: { increment: 1 } },
      }),
    ]);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.user.remove_role',
      targetType: 'User',
      targetId: userId,
      targetName: user.email,
      tenantId,
    });

    return { success: true, message: 'Role removed from user' };
  }

  // ── Tenant roles (CRM Role) ─────────────────────────────────────────────────

  async getTenantRoles(tenantId: string, query: PaginationDto) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(query);
    const where = {
      organizationId: tenant.crmOrganizationId,
      isDeleted: false,
    } as Record<string, unknown>;
    if (query.q) {
      where.OR = [
        { name: { contains: query.q, mode: 'insensitive' as const } },
        { code: { contains: query.q, mode: 'insensitive' as const } },
      ];
    }

    const [items, total] = await Promise.all([
      this.crmPrisma.role.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
      this.crmPrisma.role.count({ where }),
    ]);

    return { items, meta: buildPageMeta(page, take, total, undefined) };
  }

  async getTenantRole(tenantId: string, roleId: string) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const role = await this.crmPrisma.role.findFirst({
      where: { id: roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');
    const memberCount = await this.crmPrisma.userRole.count({
      where: { roleId, organizationId: tenant.crmOrganizationId },
    });
    return { ...role, memberCount };
  }

  async createTenantRole(
    tenantId: string,
    dto: CreateTenantRoleDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const code = (dto.code || dto.name).trim().toUpperCase().replace(/\s+/g, '_');

    const clash = await this.crmPrisma.role.findFirst({
      where: {
        organizationId: tenant.crmOrganizationId,
        isDeleted: false,
        OR: [{ name: dto.name.trim() }, { code }],
      },
    });
    if (clash) throw new ConflictException('A role with this name or code already exists');

    const role = await this.crmPrisma.role.create({
      data: {
        organizationId: tenant.crmOrganizationId,
        name: dto.name.trim(),
        code,
        description: dto.description,
        permissions: dto.permissions ?? [],
        createdById: actor.id,
        isSystem: false,
        version: 1,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.role.create',
      targetType: 'Role',
      targetId: role.id,
      targetName: role.name,
      tenantId,
      metadata: { code: role.code },
    });

    return role;
  }

  async updateTenantRole(
    tenantId: string,
    roleId: string,
    dto: UpdateTenantRoleDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const role = await this.crmPrisma.role.findFirst({
      where: { id: roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem && dto.name && dto.name.trim() !== role.name) {
      throw new BadRequestException('System roles cannot be renamed');
    }

    const updated = await this.crmPrisma.role.update({
      where: { id: roleId },
      data: {
        name: dto.name?.trim(),
        description: dto.description,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.role.update',
      targetType: 'Role',
      targetId: roleId,
      targetName: updated.name,
      tenantId,
    });

    return updated;
  }

  async deleteTenantRole(tenantId: string, roleId: string, actor: { id: string; email: string }) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const role = await this.crmPrisma.role.findFirst({
      where: { id: roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    // Validation: Check for users assigned to this role
    const userCount = await this.crmPrisma.userRole.count({
      where: { roleId, organizationId: tenant.crmOrganizationId },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Role is assigned to ${userCount} user(s). Unassign them before deleting.`,
      );
    }

    await this.crmPrisma.$transaction([
      this.crmPrisma.role.update({
        where: { id: roleId },
        data: { isDeleted: true, deletedAt: new Date(), deletedById: actor.id },
      }),
      this.crmPrisma.userRole.deleteMany({
        where: { roleId, organizationId: tenant.crmOrganizationId },
      }),
    ]);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.role.delete',
      targetType: 'Role',
      targetId: roleId,
      targetName: role.name,
      tenantId,
      severity: 'WARNING',
    });

    return { success: true, message: 'Role deleted' };
  }

  async cloneTenantRole(tenantId: string, roleId: string, actor: { id: string; email: string }) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const role = await this.crmPrisma.role.findFirst({
      where: { id: roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');

    const name = `${role.name} Copy`;
    const code = `${role.code}_COPY`;

    const clone = await this.crmPrisma.role.create({
      data: {
        organizationId: tenant.crmOrganizationId,
        name,
        code,
        description: role.description,
        permissions: role.permissions,
        createdById: actor.id,
        isSystem: false,
        version: 1,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.role.clone',
      targetType: 'Role',
      targetId: clone.id,
      targetName: clone.name,
      tenantId,
      metadata: { sourceRoleId: roleId },
    });

    return clone;
  }

  async setTenantRolePermissions(
    tenantId: string,
    roleId: string,
    dto: SetTenantRolePermissionsDto,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const role = await this.crmPrisma.role.findFirst({
      where: { id: roleId, organizationId: tenant.crmOrganizationId, isDeleted: false },
    });
    if (!role) throw new NotFoundException('Role not found');

    const updated = await this.crmPrisma.role.update({
      where: { id: roleId },
      data: {
        permissions: dto.permissions,
        version: { increment: 1 },
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.role.permissions',
      targetType: 'Role',
      targetId: roleId,
      targetName: role.name,
      tenantId,
      metadata: { permissionCount: dto.permissions.length },
    });

    return updated;
  }

  // ── Tenant permissions / login history / sessions ───────────────────────────

  async getTenantPermissions(tenantId: string): Promise<Record<string, Record<string, boolean>>> {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const permissions = await this.crmPrisma.permission.findMany({
      where: { organizationId: tenant.crmOrganizationId },
      select: { key: true, module: true },
    });

    const matrix: Record<string, Record<string, boolean>> = {};
    permissions.forEach((perm) => {
      if (!matrix[perm.module]) matrix[perm.module] = {};
      matrix[perm.module][perm.key] = true;
    });
    return matrix;
  }

  async getTenantLoginHistory(tenantId: string, query: PaginationDto) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(query);
    const where = { organizationId: tenant.crmOrganizationId } as Record<string, unknown>;
    if (query.q) where.email = { contains: query.q, mode: 'insensitive' as const };

    const [items, total] = await Promise.all([
      this.crmPrisma.loginAttempt.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.crmPrisma.loginAttempt.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, undefined) };
  }

  async getTenantSessions(tenantId: string, query: PaginationDto & { active?: boolean }) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const { page, skip, take } = resolvePage(query);
    const where = {
      organizationId: tenant.crmOrganizationId,
    } as Record<string, unknown>;
    if (query.active !== undefined) where.isRevoked = !query.active;

    const [items, total] = await Promise.all([
      this.crmPrisma.session.findMany({ where, skip, take, orderBy: { loginAt: 'desc' } }),
      this.crmPrisma.session.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, undefined) };
  }

  async revokeTenantSession(
    tenantId: string,
    sessionId: string,
    actor: { id: string; email: string },
  ) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    const session = await this.crmPrisma.session.findFirst({
      where: { id: sessionId, organizationId: tenant.crmOrganizationId },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.crmPrisma.$transaction([
      this.crmPrisma.session.update({
        where: { id: sessionId },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
      this.crmPrisma.refreshToken.updateMany({
        where: { sessionId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenant.session.revoke',
      targetType: 'Session',
      targetId: sessionId,
      tenantId,
      metadata: { userId: session.userId },
    });

    return { success: true, message: 'Session revoked' };
  }

  // ── Tenant roles listing for a user (candidates) ────────────────────────────

  async listAssignableRoles(tenantId: string) {
    const tenant = await ensureTenant(this.prisma, tenantId);
    return this.crmPrisma.role.findMany({
      where: { organizationId: tenant.crmOrganizationId, isDeleted: false },
      select: { id: true, name: true, code: true, description: true, isSystem: true },
      orderBy: { name: 'asc' },
    });
  }

  private generateTemporaryPassword(length = 12): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
    return `${out}!a1`;
  }
}
