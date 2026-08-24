import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '../../database/prisma.service';
import { CrmPrismaService } from '../../database/crm-prisma.service';
import { AppConfigService } from '../../config/app.config';
import { AuditService } from '../auth/services/audit.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { OrganizedUsersDto } from './dto/organized-users.dto';
import { UserResponseDto } from './interfaces/user-response.interface';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  avatar: true,
  isActive: true,
  isLocked: true,
  department: true,
  designation: true,
  createdAt: true,
  updatedAt: true,
  roles: { select: { role: { select: { id: true, name: true } } } },
  _count: { select: { sessions: { where: { isActive: true } } } },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmPrisma: CrmPrismaService,
    private readonly config: AppConfigService,
    private readonly auditService: AuditService,
    private readonly tenantsService: TenantsService,
  ) {}

  private get crm() {
    return this.crmPrisma as any;
  }

  /**
   * NOTE: Platform Users and CRM Users are SEPARATE entities.
   * - Platform Users: Super Admins who manage the platform (stored in platform_users table)
   * - CRM Users: Tenant-specific users who use the CRM application (stored in CRM DB User table)
   * These are NOT synchronized and should remain isolated.
   * CRM Users are managed via TenantOpsService using crmPrisma.
   */

  async create(dto: CreateUserDto, actor: { id: string; email: string }) {
    const email = dto.email.toLowerCase();
    const existing = await this.prisma.platformUser.findUnique({ where: { email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, this.config.bcryptRounds);

    const user = await this.prisma.platformUser.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
        department: dto.department,
        designation: dto.designation,
        createdById: actor.id,
      },
      select: USER_SELECT,
    });

    await this.assignRoles(user.id, dto.roleIds ?? [], actor.id);

    const withRoles = await this.prisma.platformUser.findUnique({
      where: { id: user.id },
      select: USER_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.create',
      targetType: 'PlatformUser',
      targetId: user.id,
      targetName: user.name,
      metadata: { email: user.email, roleIds: dto.roleIds ?? [] },
    });

    return this.mapUser(withRoles!);
  }

  async findAll(dto: ListUsersDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = { isDeleted: false };
    if (typeof dto.isActive === 'boolean') where.isActive = dto.isActive;
    if (typeof dto.isLocked === 'boolean') where.isLocked = dto.isLocked;
    if (dto.roleId) where.roles = { some: { roleId: dto.roleId } };
    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { email: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveOrderBy(dto.sort);

    const [items, total] = await Promise.all([
      this.prisma.platformUser.findMany({
        where,
        orderBy,
        skip,
        take,
        select: USER_SELECT,
      }),
      this.prisma.platformUser.count({ where }),
    ]);

    return {
      items: items.map((u) => this.mapUser(u)),
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  /**
   * Organization-centric user list: real CRM users across all tenants,
   * each enriched with its organization (tenant) name. Used by the Users page
   * which groups users by organization.
   */
  async findOrganized(dto: OrganizedUsersDto) {
    const { page, skip, take } = resolvePage(dto);

    // Map CRM organization id -> platform tenant (org) info.
    const tenants = await this.prisma.tenant.findMany({
      where: { isDeleted: false },
      select: { id: true, name: true, status: true, crmOrganizationId: true },
    });
    const orgByCrmId = new Map<
      string,
      { tenantId: string; tenantName: string; tenantStatus: string }
    >();
    for (const t of tenants) {
      if (t.crmOrganizationId) {
        orgByCrmId.set(t.crmOrganizationId, {
          tenantId: t.id,
          tenantName: t.name,
          tenantStatus: t.status,
        });
      }
    }
    const crmOrgIds = [...orgByCrmId.keys()];

    const where: Record<string, unknown> = { isDeleted: false };
    if (crmOrgIds.length > 0) where.organizationId = { in: crmOrgIds };
    if (dto.organizationId) {
      const tenant = tenants.find((t) => t.id === dto.organizationId);
      where.organizationId = tenant?.crmOrganizationId ?? '__none__';
    }
    if (dto.role) where.role = dto.role;
    if (dto.status === 'active') where.isActive = true;
    if (dto.status === 'inactive') where.isActive = false;
    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { email: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.crm.user.findMany({
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
          isLocked: true,
          lastLogin: true,
          department: true,
          designation: true,
          mobile: true,
          organizationId: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.crm.user.count({ where }),
    ]);

    return {
      items: items.map((u) => {
        const org = u.organizationId ? orgByCrmId.get(u.organizationId) : undefined;
        return {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          isActive: u.isActive,
          isLocked: u.isLocked,
          lastLogin: u.lastLogin,
          department: u.department,
          designation: u.designation,
          mobile: u.mobile,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          organizationId: u.organizationId,
          organizationName: org?.tenantName ?? '—',
          tenantId: org?.tenantId ?? null,
          tenantStatus: org?.tenantStatus ?? null,
        };
      }),
      meta: {
        ...buildPageMeta(page, take, total, dto.sort),
        organizations: tenants.map((t) => ({ id: t.id, name: t.name, status: t.status })),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.platformUser.findUnique({
      where: { id, isDeleted: false },
      select: USER_SELECT,
    });
    if (!user) throw new NotFoundException('User not found');
    return this.mapUser(user);
  }

  async update(id: string, dto: UpdateUserDto, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    if (dto.email) {
      const email = dto.email.toLowerCase();
      const clash = await this.prisma.platformUser.findUnique({ where: { email } });
      if (clash && clash.id !== id) throw new ConflictException('Email already in use');
      dto.email = email;
    }

    if (dto.version && dto.version !== user.version) {
      throw new ConflictException('User was modified by another request. Refresh and retry.');
    }

    const expectedVersion = dto.version ?? user.version;

    let updated;
    try {
      updated = await this.prisma.platformUser.update({
        where: { id, version: expectedVersion },
        data: {
          email: dto.email,
          name: dto.name,
          department: dto.department,
          designation: dto.designation,
          isActive: dto.isActive,
          updatedById: actor.id,
          version: { increment: 1 },
          ...(dto.email ? { permissionVersion: user.permissionVersion + 1 } : {}),
        },
        select: USER_SELECT,
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('User was modified by another request. Refresh and retry.');
      }
      throw error;
    }

    if (dto.roleIds) await this.assignRoles(id, dto.roleIds, actor.id);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.update',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
      metadata: { changedFields: Object.keys(dto) },
    });

    return this.mapUser(updated);
  }

  async remove(id: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');
    if (user.id === actor.id) throw new ForbiddenException('You cannot delete your own account');

    const updated = await this.prisma.platformUser.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: actor.id, isActive: false },
      select: USER_SELECT,
    });

    await this.prisma.platformSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedById: actor.id },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.soft_delete',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
    });

    return { success: true, message: 'User deleted' };
  }

  async restore(id: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || !user.isDeleted) throw new NotFoundException('User not found or not deleted');

    const updated = await this.prisma.platformUser.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
        isActive: true,
        updatedById: actor.id,
      },
      select: USER_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.restore',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
    });

    return this.mapUser(updated);
  }

  async suspend(id: string, actor: { id: string; email: string }, reason?: string) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');
    if (user.id === actor.id) throw new ForbiddenException('You cannot suspend your own account');

    const updated = await this.prisma.platformUser.update({
      where: { id },
      data: { isActive: false, updatedById: actor.id },
      select: USER_SELECT,
    });

    await this.prisma.platformSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedById: actor.id },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.suspend',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
      metadata: { reason },
    });

    return { success: true, message: 'User suspended', user: this.mapUser(updated) };
  }

  async unsuspend(id: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const updated = await this.prisma.platformUser.update({
      where: { id },
      data: { isActive: true, updatedById: actor.id },
      select: USER_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.unsuspend',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
    });

    return { success: true, message: 'User unsuspended', user: this.mapUser(updated) };
  }

  async unlock(id: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const updated = await this.prisma.platformUser.update({
      where: { id },
      data: {
        isLocked: false,
        lockedUntil: null,
        loginAttempts: 0,
        updatedById: actor.id,
      },
      select: USER_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.unlock',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: updated.name,
    });

    return { success: true, message: 'User unlocked', user: this.mapUser(updated) };
  }

  async resetPassword(id: string, newPassword: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const passwordHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);

    await this.prisma.platformUser.update({
      where: { id },
      data: {
        passwordHash,
        passwordVersion: user.passwordVersion + 1,
        lastPasswordChangeAt: new Date(),
        mustChangePassword: true,
        isLocked: false,
        lockedUntil: null,
        loginAttempts: 0,
        updatedById: actor.id,
      },
    });

    await this.prisma.platformSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedById: actor.id },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.reset_password',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: user.name,
    });

    return { success: true, message: 'Password reset. User must change it on next login.' };
  }

  async forceLogout(id: string, actor: { id: string; email: string }) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const result = await this.prisma.platformSession.updateMany({
      where: { userId: id, isActive: true },
      data: { isActive: false, revokedAt: new Date(), revokedById: actor.id },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'users.force_logout',
      targetType: 'PlatformUser',
      targetId: id,
      targetName: user.name,
      metadata: { revokedSessions: result.count },
    });

    return { success: true, message: `Revoked ${result.count} active session(s)` };
  }

  async getSessions(id: string) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const sessions = await this.prisma.platformSession.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        isActive: true,
        lastActivityAt: true,
        createdAt: true,
        expiresAt: true,
        revokedAt: true,
      },
    });
    return { items: sessions };
  }

  async getLoginHistory(id: string) {
    const user = await this.prisma.platformUser.findUnique({ where: { id } });
    if (!user || user.isDeleted) throw new NotFoundException('User not found');

    const attempts = await this.prisma.loginAttempt.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        email: true,
        ipAddress: true,
        userAgent: true,
        success: true,
        failureReason: true,
        createdAt: true,
      },
    });
    return { items: attempts };
  }

  private async assignRoles(userId: string, roleIds: string[], assignedById: string) {
    if (roleIds.length === 0) return;
    const existing = await this.prisma.platformUserRole.findMany({
      where: { userId },
      select: { roleId: true },
    });
    const existingIds = existing.map((r) => r.roleId);
    const toAdd = roleIds.filter((id) => !existingIds.includes(id));
    const toRemove = existingIds.filter((id) => !roleIds.includes(id));

    if (toRemove.length > 0) {
      await this.prisma.platformUserRole.deleteMany({
        where: { userId, roleId: { in: toRemove } },
      });
    }
    if (toAdd.length > 0) {
      await this.prisma.platformUserRole.createMany({
        data: toAdd.map((roleId) => ({ userId, roleId, assignedById })),
      });
    }
  }

  private resolveOrderBy(sort?: string): object {
    const [field, direction] = (sort ?? 'createdAt:desc').split(':');
    const allowed: Record<string, string> = {
      name: 'name',
      email: 'email',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const key = allowed[field] ?? 'createdAt';
    const dir = direction === 'asc' ? 'asc' : 'desc';
    return { [key]: dir };
  }

  private mapUser(user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    isActive: boolean;
    isLocked: boolean;
    department: string | null;
    designation: string | null;
    createdAt: Date;
    updatedAt: Date;
    roles: { role: { id: string; name: string } }[];
    _count: { sessions: number };
  }): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isActive: user.isActive,
      isLocked: user.isLocked,
      department: user.department,
      designation: user.designation,
      activeSessions: user._count.sessions,
      roles: user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
