import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { ConfigService } from '@nestjs/config';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';
import { TenantStatus } from '@prisma/client';
import {
  ImpersonateDto,
  ListImpersonationLogsDto,
  EndImpersonationDto,
} from './dto/impersonation.dto';

const IMPERSONATION_TTL = '30m';

@Injectable()
export class ImpersonationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Starts an impersonation session for a tenant. Writes an ImpersonationLog row
   * and returns a scoped grant token that a tenant-facing consumer can validate.
   */
  async impersonate(tenantId: string, dto: ImpersonateDto, actor: { id: string; email: string }) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant || tenant.isDeleted) throw new NotFoundException('Tenant not found');
    if (tenant.status === TenantStatus.SUSPENDED || tenant.status === TenantStatus.DELETED) {
      throw new ForbiddenException(
        `Tenant is ${tenant.status.toLowerCase()}; impersonation denied`,
      );
    }

    let targetUserId: string | undefined;
    if (dto.targetUserId) {
      const target = await this.prisma.platformUser.findUnique({ where: { id: dto.targetUserId } });
      if (!target) throw new BadRequestException('targetUserId not found');
      targetUserId = target.id;
    }

    // Block overlapping active impersonations by the same admin on the same tenant.
    const existing = await this.prisma.impersonationLog.findFirst({
      where: { superAdminId: actor.id, tenantId, endedAt: null },
    });
    if (existing) {
      throw new BadRequestException('An impersonation session is already active for this tenant');
    }

    const grantId = randomUUID();
    const log = await this.prisma.impersonationLog.create({
      data: {
        superAdminId: actor.id,
        superAdminEmail: actor.email,
        tenantId,
        targetUserId,
        reason: dto.reason,
        grantId,
        startedAt: new Date(),
      },
    });

    const secret =
      this.configService.get<string>('impersonation.secret') ||
      `${this.configService.get<string>('jwt.secret')}-impersonation`;
    const token = this.jwtService.sign(
      {
        sub: actor.id,
        email: actor.email,
        tenantId,
        grantId,
        purpose: 'impersonation',
      },
      { secret, expiresIn: IMPERSONATION_TTL },
    );

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'impersonation.started',
      targetType: 'Tenant',
      targetId: tenantId,
      targetName: tenant.name,
      metadata: { grantId, reason: dto.reason },
    });

    return {
      grantId,
      token,
      expiresIn: IMPERSONATION_TTL,
      startedAt: log.startedAt,
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, status: tenant.status },
    };
  }

  /** Ends the calling admin's active impersonation session(s). */
  async exit(actor: { id: string; email: string }, dto: EndImpersonationDto) {
    const active = await this.prisma.impersonationLog.findMany({
      where: { superAdminId: actor.id, endedAt: null },
    });
    if (active.length === 0) {
      throw new NotFoundException('No active impersonation session');
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(
      active.map((log) =>
        this.prisma.impersonationLog.update({
          where: { id: log.id },
          data: {
            endedAt: now,
            durationSeconds: Math.round((now.getTime() - log.startedAt.getTime()) / 1000),
            endedBy: actor.id,
          },
        }),
      ),
    );

    for (const log of active) {
      await this.auditService.record({
        actorId: actor.id,
        actorEmail: actor.email,
        action: 'impersonation.ended',
        targetType: 'Tenant',
        targetId: log.tenantId,
        metadata: { grantId: log.grantId, reason: dto.reason },
      });
    }

    return { success: true, ended: updated.length, reason: dto.reason };
  }

  /** Active impersonation for the calling admin (used by the UI to show "exit" state). */
  async findActiveForUser(userId: string) {
    const log = await this.prisma.impersonationLog.findFirst({
      where: { superAdminId: userId, endedAt: null },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        tenantId: true,
        grantId: true,
        reason: true,
        startedAt: true,
        tenant: { select: { id: true, name: true, slug: true, status: true } },
      },
    });
    return log ? { active: true, ...log } : { active: false };
  }

  async findAll(dto: ListImpersonationLogsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.tenantId) where.tenantId = dto.tenantId;
    if (dto.superAdminEmail)
      where.superAdminEmail = { contains: dto.superAdminEmail, mode: 'insensitive' };
    if (dto.active === 'true') where.endedAt = null;
    if (dto.active === 'false') where.endedAt = { not: null };

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
          tenant: { select: { id: true, name: true, slug: true } },
        },
      }),
      this.prisma.impersonationLog.count({ where }),
    ]);

    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async findOne(id: string) {
    const log = await this.prisma.impersonationLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Impersonation log not found');
    return log;
  }
}
