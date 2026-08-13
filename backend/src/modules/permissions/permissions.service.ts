import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ListPermissionsDto } from './dto/list-permissions.dto';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate that there are no orphan permissions (permissions not assigned to any role)
   * This can be called periodically or before certain operations
   */
  async validateNoOrphanPermissions() {
    const orphanPermissions = await this.prisma.permission.findMany({
      where: {
        roles: {
          none: {},
        },
      },
      select: { id: true, key: true, module: true },
    });

    if (orphanPermissions.length > 0) {
      // Log orphans but don't throw - they might be intentional for future use
      console.warn(`Found ${orphanPermissions.length} orphan permissions:`, orphanPermissions.map(p => p.key));
    }

    return { count: orphanPermissions.length, permissions: orphanPermissions };
  }

  /**
   * Validate that there are no orphan roles (roles with no users)
   */
  async validateNoOrphanRoles() {
    const orphanRoles = await this.prisma.platformRole.findMany({
      where: {
        isDeleted: false,
        users: {
          none: {},
        },
      },
      select: { id: true, name: true },
    });

    if (orphanRoles.length > 0) {
      console.warn(`Found ${orphanRoles.length} orphan roles:`, orphanRoles.map(r => r.name));
    }

    return { count: orphanRoles.length, roles: orphanRoles };
  }

  async findAll(dto: ListPermissionsDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = {};
    if (!dto.includeDeprecated) where.isDeprecated = false;
    if (dto.module) where.module = dto.module;
    if (dto.category) where.category = dto.category;
    if (dto.q) {
      where.OR = [
        { key: { contains: dto.q, mode: 'insensitive' } },
        { label: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveOrderBy(dto.sort);

    const [items, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          key: true,
          module: true,
          label: true,
          description: true,
          category: true,
          isDeprecated: true,
          createdAt: true,
          _count: { select: { roles: true } },
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      items: items.map((p) => ({
        id: p.id,
        key: p.key,
        module: p.module,
        label: p.label,
        description: p.description,
        category: p.category,
        isDeprecated: p.isDeprecated,
        roleCount: p._count.roles,
      })),
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  async findOne(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      select: {
        id: true,
        key: true,
        module: true,
        label: true,
        description: true,
        category: true,
        isDeprecated: true,
        createdAt: true,
        roles: {
          select: { role: { select: { id: true, name: true, isSystem: true } } },
          orderBy: { role: { name: 'asc' } },
        },
      },
    });
    if (!permission) throw new NotFoundException('Permission not found');
    return {
      id: permission.id,
      key: permission.key,
      module: permission.module,
      label: permission.label,
      description: permission.description,
      category: permission.category,
      isDeprecated: permission.isDeprecated,
      roles: permission.roles.map((r) => r.role),
    };
  }

  private resolveOrderBy(sort?: string): object {
    const [field, direction] = (sort ?? 'key:asc').split(':');
    const allowed: Record<string, string> = {
      key: 'key',
      module: 'module',
      category: 'category',
    };
    const key = allowed[field] ?? 'key';
    const dir = direction === 'desc' ? 'desc' : 'asc';
    return { [key]: dir };
  }
}
