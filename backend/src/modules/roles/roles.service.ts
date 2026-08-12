import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { ListRolesDto } from './dto/list-roles.dto';
import { RoleResponseDto } from './interfaces/role-response.interface';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(dto: ListRolesDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = { isDeleted: false };
    if (typeof dto.isActive === 'boolean') where.isActive = dto.isActive;
    if (dto.q) {
      where.OR = [
        { name: { contains: dto.q, mode: 'insensitive' } },
        { description: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const orderBy = this.resolveOrderBy(dto.sort);

    const [roles, total] = await Promise.all([
      this.prisma.platformRole.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          description: true,
          isSystem: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { users: true } },
        },
      }),
      this.prisma.platformRole.count({ where }),
    ]);

    return {
      items: roles.map((r) => this.mapSummary(r)),
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  async findOne(id: string): Promise<RoleResponseDto> {
    const role = await this.prisma.platformRole.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
        permissions: {
          select: { permission: { select: { id: true, key: true } } },
          orderBy: { permission: { key: 'asc' } },
        },
      },
    });
    if (!role || role.isDeleted) throw new NotFoundException('Role not found');
    return this.mapFull(role);
  }

  async create(dto: CreateRoleDto, actor: { id: string; email: string }) {
    const name = dto.name.trim().toUpperCase();
    const existing = await this.prisma.platformRole.findUnique({ where: { name } });
    if (existing) throw new ConflictException('A role with this name already exists');

    const role = await this.prisma.platformRole.create({
      data: {
        name,
        description: dto.description,
        createdById: actor.id,
      },
    });

    await this.replacePermissions(role.id, dto.permissionKeys ?? [], actor.id);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'roles.create',
      targetType: 'PlatformRole',
      targetId: role.id,
      targetName: role.name,
      metadata: { permissionKeys: dto.permissionKeys ?? [] },
    });

    return this.findOne(role.id);
  }

  async update(id: string, dto: UpdateRoleDto, actor: { id: string; email: string }) {
    const role = await this.prisma.platformRole.findUnique({ where: { id } });
    if (!role || role.isDeleted) throw new NotFoundException('Role not found');
    if (role.isSystem && dto.name && dto.name.trim().toUpperCase() !== role.name) {
      throw new BadRequestException('System roles cannot be renamed');
    }

    if (dto.version && dto.version !== role.version) {
      throw new ConflictException('Role was modified by another request. Refresh and retry.');
    }

    const name = dto.name ? dto.name.trim().toUpperCase() : undefined;
    if (name) {
      const clash = await this.prisma.platformRole.findUnique({ where: { name } });
      if (clash && clash.id !== id) throw new ConflictException('Role name already in use');
    }

    await this.prisma.platformRole.update({
      where: { id },
      data: {
        name,
        description: dto.description,
        isActive: dto.isActive,
        updatedById: actor.id,
      },
    });

    if (dto.permissionKeys) {
      await this.replacePermissions(id, dto.permissionKeys, actor.id);
    }

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'roles.update',
      targetType: 'PlatformRole',
      targetId: id,
      targetName: name ?? role.name,
      metadata: { changedFields: Object.keys(dto) },
    });

    return this.findOne(id);
  }

  async remove(id: string, actor: { id: string; email: string }) {
    const role = await this.prisma.platformRole.findUnique({ where: { id } });
    if (!role || role.isDeleted) throw new NotFoundException('Role not found');
    if (role.isSystem) throw new BadRequestException('System roles cannot be deleted');

    const userCount = await this.prisma.platformUserRole.count({ where: { roleId: id } });
    if (userCount > 0) {
      throw new BadRequestException(
        `Role is assigned to ${userCount} user(s). Unassign them before deleting.`,
      );
    }

    await this.prisma.platformRole.update({
      where: { id },
      data: { isDeleted: true, deletedAt: new Date(), deletedById: actor.id, isActive: false },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'roles.delete',
      targetType: 'PlatformRole',
      targetId: id,
      targetName: role.name,
    });

    return { success: true, message: 'Role deleted' };
  }

  async assignPermissions(
    id: string,
    dto: AssignPermissionsDto,
    actor: { id: string; email: string },
  ) {
    const role = await this.prisma.platformRole.findUnique({ where: { id } });
    if (!role || role.isDeleted) throw new NotFoundException('Role not found');

    const updated = await this.replacePermissions(id, dto.permissionKeys, actor.id);

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'roles.permissions_assigned',
      targetType: 'PlatformRole',
      targetId: id,
      targetName: role.name,
      metadata: { permissionKeys: dto.permissionKeys },
    });

    return this.mapFull(updated);
  }

  async getRoleUsers(id: string) {
    const role = await this.prisma.platformRole.findUnique({ where: { id } });
    if (!role || role.isDeleted) throw new NotFoundException('Role not found');

    const assignments = await this.prisma.platformUserRole.findMany({
      where: { roleId: id },
      include: {
        user: {
          select: { id: true, email: true, name: true, isActive: true, createdAt: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return { items: assignments.map((a) => a.user) };
  }

  private async replacePermissions(roleId: string, keys: string[], grantedById: string) {
    const found = await this.prisma.permission.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true },
    });
    if (found.length !== keys.length) {
      const foundSet = new Set(found.map((p) => p.key));
      const missing = keys.filter((k) => !foundSet.has(k));
      throw new BadRequestException(`Unknown permission(s): ${missing.join(', ')}`);
    }

    const permissionIds = found.map((p) => p.id);
    const existing = await this.prisma.rolePermission.findMany({
      where: { roleId },
      select: { permissionId: true },
    });
    const existingIds = existing.map((r) => r.permissionId);
    const toRemove = existingIds.filter((id) => !permissionIds.includes(id));
    const toAdd = permissionIds.filter((id) => !existingIds.includes(id));

    await this.prisma.$transaction([
      ...(toRemove.length > 0
        ? [
            this.prisma.rolePermission.deleteMany({
              where: { roleId, permissionId: { in: toRemove } },
            }),
          ]
        : []),
      ...(toAdd.length > 0
        ? [
            this.prisma.rolePermission.createMany({
              data: toAdd.map((permissionId) => ({ roleId, permissionId, grantedById })),
            }),
          ]
        : []),
    ]);

    const role = await this.prisma.platformRole.findUnique({
      where: { id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        isSystem: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { users: true } },
        permissions: {
          select: { permission: { select: { id: true, key: true } } },
          orderBy: { permission: { key: 'asc' } },
        },
      },
    });

    return role!;
  }

  private resolveOrderBy(sort?: string): object {
    const [field, direction] = (sort ?? 'createdAt:desc').split(':');
    const allowed: Record<string, string> = {
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
    };
    const key = allowed[field] ?? 'createdAt';
    const dir = direction === 'asc' ? 'asc' : 'desc';
    return { [key]: dir };
  }

  private mapSummary(role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { users: number };
  }): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: [],
    };
  }

  private mapFull(role: {
    id: string;
    name: string;
    description: string | null;
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: { users: number };
    permissions: { permission: { id: string; key: string } }[];
  }): RoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      userCount: role._count.users,
      permissions: role.permissions.map((p) => ({ id: p.permission.id, key: p.permission.key })),
    };
  }
}
