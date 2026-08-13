import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, TenantStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CrmPrismaService } from '../../database/crm-prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { SuspendTenantDto } from './dto/tenant-actions.dto';
import { TenantResponseDto } from './interfaces/tenant-response.interface';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';

const TENANT_SELECT = {
  id: true,
  name: true,
  slug: true,
  email: true,
  phone: true,
  domain: true,
  status: true,
  maxUsers: true,
  maxStorageGB: true,
  modulesEnabled: true,
  syncState: true,
  lastSyncedAt: true,
  syncError: true,
  syncVersion: true,
  notes: true,
  crmOrganizationId: true,
  isDeleted: true,
  version: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class TenantsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crmPrisma: CrmPrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTenantDto, actor: { id: string; email: string }) {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('A tenant with this slug already exists');

    if (dto.domain) {
      const clash = await this.prisma.tenant.findUnique({ where: { domain: dto.domain } });
      if (clash) throw new ConflictException('A tenant with this domain already exists');
    }

    const defaultModules = [
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

    // Step 1: Create Platform DB Tenant record with SYNCING state
    let tenant;
    try {
      tenant = await this.prisma.tenant.create({
        data: {
          name: dto.name.trim(),
          slug,
          email: dto.email,
          phone: dto.phone,
          domain: dto.domain,
          status: dto.status ?? TenantStatus.ACTIVE,
          maxUsers: dto.maxUsers ?? 25,
          maxStorageGB: dto.maxStorageGB ?? 10,
          notes: dto.notes,
          createdById: actor.id,
          syncState: 'SYNCING',
          syncVersion: 1,
        },
        select: TENANT_SELECT,
      });
    } catch (error) {
      throw new BadRequestException('Failed to create tenant in platform database');
    }

    // Step 2: Mark tenant as SYNCED (CRM sync is not implemented in this version)
    try {
      tenant = await this.prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          syncState: 'SYNCED',
          lastSyncedAt: new Date(),
          syncVersion: { increment: 1 },
          modulesEnabled: defaultModules,
          version: { increment: 1 },
        },
        select: TENANT_SELECT,
      });
    } catch (error) {
      throw new BadRequestException('Failed to update tenant sync state');
    }

    // Step 4: Create audit log entry
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.create',
      targetType: 'Tenant',
      targetId: tenant.id,
      targetName: tenant.name,
      metadata: { slug: tenant.slug, status: tenant.status, crmOrganizationId: tenant.crmOrganizationId },
    });

    return this.mapTenant(tenant);
  }

  async findAll(dto: ListTenantsDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = { isDeleted: false };
    if (dto.includeDeleted) delete where.isDeleted;
    if (dto.status) where.status = dto.status;
    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { slug: { contains: dto.q, mode: 'insensitive' } },
        { domain: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveOrderBy(dto.sort);

    const [items, total] = await Promise.all([
      this.prisma.tenant.findMany({ where, orderBy, skip, take, select: TENANT_SELECT }),
      this.prisma.tenant.count({ where }),
    ]);

    const counts = await this.resolveUserCounts(items.map((t) => t.crmOrganizationId).filter(Boolean) as string[]);

    return {
      items: items.map((t) => this.mapTenant(t, t.crmOrganizationId ? counts.get(t.crmOrganizationId) ?? 0 : 0)),
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      select: TENANT_SELECT,
    });
    if (!tenant || tenant.isDeleted === true) throw new NotFoundException('Tenant not found');

    const count = tenant.crmOrganizationId
      ? await this.resolveUserCounts([tenant.crmOrganizationId])
      : new Map<string, number>();

    return this.mapTenant(tenant, tenant.crmOrganizationId ? count.get(tenant.crmOrganizationId) ?? 0 : 0);
  }

  private async resolveUserCounts(organizationIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (organizationIds.length === 0) return counts;
    const rows = await this.crmPrisma.user.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: organizationIds }, isDeleted: false },
      _count: { _all: true },
    });
    rows.forEach((row) => {
      if (row.organizationId) {
        counts.set(row.organizationId, row._count._all);
      }
    });
    return counts;
  }

  async update(id: string, dto: UpdateTenantDto, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');

    if (dto.domain) {
      const clash = await this.prisma.tenant.findUnique({ where: { domain: dto.domain } });
      if (clash && clash.id !== id) throw new ConflictException('Domain already in use');
    }

    const expectedVersion = dto.version ?? tenant.version;

    let updated;
    try {
      updated = await this.prisma.tenant.update({
        where: { id, version: expectedVersion },
        data: {
          name: dto.name ? dto.name.trim() : undefined,
          email: dto.email,
          phone: dto.phone,
          domain: dto.domain,
          status: dto.status,
          maxUsers: dto.maxUsers,
          maxStorageGB: dto.maxStorageGB,
          notes: dto.notes,
          version: { increment: 1 },
          updatedById: actor.id,
        },
        select: TENANT_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('Tenant was modified by another request. Refresh and retry.');
      }
      throw error;
    }

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.update',
      targetType: 'Tenant',
      targetId: id,
      targetName: updated.name,
      metadata: { changedFields: Object.keys(dto) },
    });

    return this.mapTenant(updated);
  }

  async remove(id: string, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: actor.id,
        status: TenantStatus.DELETED,
        updatedById: actor.id,
      },
      select: TENANT_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.soft_delete',
      targetType: 'Tenant',
      targetId: id,
      targetName: updated.name,
    });

    return { success: true, message: 'Tenant deleted' };
  }

  async restore(id: string, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || !tenant.isDeleted)
      throw new NotFoundException('Tenant not found or not deleted');

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
        deletedById: null,
        status: TenantStatus.ACTIVE,
        updatedById: actor.id,
      },
      select: TENANT_SELECT,
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.restore',
      targetType: 'Tenant',
      targetId: id,
      targetName: updated.name,
    });

    return this.mapTenant(updated);
  }

  async suspend(id: string, dto: SuspendTenantDto, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new BadRequestException('Tenant is already suspended');
    }

    const expectedVersion = dto.version ?? tenant.version;

    // Step 1: Update Platform DB Tenant.status = SUSPENDED
    let updated;
    try {
      updated = await this.prisma.tenant.update({
        where: { id, version: expectedVersion },
        data: {
          status: TenantStatus.SUSPENDED,
          version: { increment: 1 },
          updatedById: actor.id,
        },
        select: TENANT_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('Tenant was modified by another request. Refresh and retry.');
      }
      throw error;
    }

    // Step 2: Update CRM Organization status via crmPrisma (compensating transaction)
    if (updated.crmOrganizationId) {
      try {
        await this.crmPrisma.$transaction(async (crmTx) => {
          // Update CRM Organization status to Suspended
          await crmTx.organization.update({
            where: { id: updated.crmOrganizationId },
            data: { status: 'Suspended' },
          });

          // Update all users in this organization to inactive
          await crmTx.user.updateMany({
            where: { organizationId: updated.crmOrganizationId, isDeleted: false },
            data: { isActive: false },
          });

          // Invalidate all CRM Sessions for this organization
          await crmTx.session.updateMany({
            where: { organizationId: updated.crmOrganizationId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
          });

          await crmTx.refreshToken.updateMany({
            where: { organizationId: updated.crmOrganizationId, isRevoked: false },
            data: { isRevoked: true, revokedAt: new Date() },
          });
        });
      } catch (error) {
        // Compensating transaction: Revert tenant status if CRM update fails
        await this.prisma.tenant.update({
          where: { id },
          data: {
            status: TenantStatus.ACTIVE,
            version: { increment: 1 },
            updatedById: actor.id,
            syncError: 'Failed to suspend CRM resources',
          },
        });
        throw new BadRequestException('Failed to suspend CRM resources. Tenant status reverted.');
      }
    }

    // Step 3: Create audit log entry
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.suspend',
      targetType: 'Tenant',
      targetId: id,
      targetName: updated.name,
      metadata: { reason: dto.reason, crmOrganizationId: updated.crmOrganizationId },
    });

    return { success: true, message: 'Tenant suspended', tenant: this.mapTenant(updated) };
  }

  async unsuspend(id: string, dto: SuspendTenantDto, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');

    if (tenant.status !== TenantStatus.SUSPENDED) {
      throw new BadRequestException('Tenant is not suspended');
    }

    const expectedVersion = dto.version ?? tenant.version;

    // Step 1: Update Platform DB Tenant.status = ACTIVE
    let updated;
    try {
      updated = await this.prisma.tenant.update({
        where: { id, version: expectedVersion },
        data: { 
          status: TenantStatus.ACTIVE, 
          version: { increment: 1 },
          updatedById: actor.id 
        },
        select: TENANT_SELECT,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new ConflictException('Tenant was modified by another request. Refresh and retry.');
      }
      throw new BadRequestException('Failed to update tenant status');
    }

    // Step 2: Update CRM Organization status via crmPrisma (compensating transaction)
    if (updated.crmOrganizationId) {
      try {
        await this.crmPrisma.$transaction(async (crmTx) => {
          // Update CRM Organization status to Active
          await crmTx.organization.update({
            where: { id: updated.crmOrganizationId },
            data: { status: 'Active' },
          });

          // Enable CRM login for users (set isActive back to true for users that were active before)
          await crmTx.user.updateMany({
            where: {
              organizationId: updated.crmOrganizationId,
              isDeleted: false,
              isLocked: false,
            },
            data: { isActive: true },
          });
        });
      } catch (error) {
        // Compensating transaction: Revert tenant status if CRM update fails
        await this.prisma.tenant.update({
          where: { id },
          data: {
            status: TenantStatus.SUSPENDED,
            version: { increment: 1 },
            updatedById: actor.id,
            syncError: 'Failed to unsuspend CRM resources',
          },
        });
        throw new BadRequestException('Failed to unsuspend CRM resources. Tenant status reverted.');
      }
    }

    // Step 3: Create audit log entry
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'tenants.unsuspend',
      targetType: 'Tenant',
      targetId: id,
      targetName: updated.name,
      metadata: { crmOrganizationId: updated.crmOrganizationId },
    });

    return { success: true, message: 'Tenant activated', tenant: this.mapTenant(updated) };
  }

  private resolveOrderBy(sort?: string): object {
    const [field, direction] = (sort ?? 'createdAt:desc').split(':');
    const allowed: Record<string, string> = {
      name: 'name',
      status: 'status',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const key = allowed[field] ?? 'createdAt';
    const dir = direction === 'asc' ? 'asc' : 'desc';
    return { [key]: dir };
  }

  private mapTenant(
    tenant: {
      id: string;
      name: string;
      slug: string;
      email: string | null;
      phone: string | null;
      domain: string | null;
      status: string;
      maxUsers: number;
      maxStorageGB: number;
      modulesEnabled: unknown;
      syncState: string;
      lastSyncedAt: Date | null;
      syncError: string | null;
      syncVersion: number;
      notes: string | null;
      crmOrganizationId: string | null;
      version: number;
      createdAt: Date;
      updatedAt: Date;
    },
    userCount = 0,
  ): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      email: tenant.email,
      phone: tenant.phone,
      domain: tenant.domain,
      status: tenant.status,
      maxUsers: tenant.maxUsers,
      maxStorageGB: tenant.maxStorageGB,
      modulesEnabled: tenant.modulesEnabled as string[] | null,
      syncState: tenant.syncState,
      lastSyncedAt: tenant.lastSyncedAt,
      syncError: tenant.syncError,
      syncVersion: tenant.syncVersion,
      notes: tenant.notes,
      crmOrganizationId: tenant.crmOrganizationId,
      version: tenant.version,
      userCount,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }
}
