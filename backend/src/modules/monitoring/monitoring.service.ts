import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { ListAuditLogsDto, ListErrorsDto } from './dto/monitoring.dto';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Injectable()
export class MonitoringService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listAuditLogs(dto: ListAuditLogsDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = {};
    if (dto.actorId) where.actorId = dto.actorId;
    if (dto.actorEmail) where.actorEmail = { contains: dto.actorEmail, mode: 'insensitive' };
    if (dto.action) where.action = { contains: dto.action, mode: 'insensitive' };
    if (dto.targetType) where.targetType = dto.targetType;
    if (dto.targetId) where.targetId = dto.targetId;
    if (dto.severity) where.severity = dto.severity;
    if (dto.q) {
      where.OR = [
        { action: { contains: dto.q, mode: 'insensitive' } },
        { actorEmail: { contains: dto.q, mode: 'insensitive' } },
        { targetName: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

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
          tenantId: true,
          requestId: true,
          correlationId: true,
          createdAt: true,
        },
      }),
      this.prisma.platformAuditLog.count({ where }),
    ]);

    return {
      items,
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  async findAuditLog(id: string) {
    const log = await this.prisma.platformAuditLog.findUnique({ where: { id } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }

  async listErrors(dto: ListErrorsDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = {};
    if (dto.status) where.status = dto.status;
    if (dto.severity) where.severity = dto.severity;
    if (dto.service) where.service = dto.service;
    if (dto.q) {
      where.OR = [
        { message: { contains: dto.q, mode: 'insensitive' } },
        { type: { contains: dto.q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.platformError.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          service: true,
          type: true,
          message: true,
          severity: true,
          status: true,
          file: true,
          method: true,
          createdAt: true,
          resolvedAt: true,
        },
      }),
      this.prisma.platformError.count({ where }),
    ]);

    return {
      items,
      meta: buildPageMeta(page, take, total, dto.sort),
    };
  }

  async findError(id: string) {
    const error = await this.prisma.platformError.findUnique({ where: { id } });
    if (!error) throw new NotFoundException('Error not found');
    return error;
  }

  async resolveError(
    id: string,
    resolution: string | undefined,
    actor: { id: string; email: string },
  ) {
    const error = await this.prisma.platformError.findUnique({ where: { id } });
    if (!error) throw new NotFoundException('Error not found');

    const updated = await this.prisma.platformError.update({
      where: { id },
      data: {
        status: ErrorStatus.RESOLVED,
        resolvedBy: actor.id,
        resolvedAt: new Date(),
        resolution,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'monitoring.error_resolved',
      targetType: 'PlatformError',
      targetId: id,
      metadata: { service: error.service, message: error.message },
    });

    return updated;
  }

  async dismissError(id: string, actor: { id: string; email: string }) {
    const error = await this.prisma.platformError.findUnique({ where: { id } });
    if (!error) throw new NotFoundException('Error not found');

    const updated = await this.prisma.platformError.update({
      where: { id },
      data: { status: ErrorStatus.DISMISSED, resolvedBy: actor.id, resolvedAt: new Date() },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'monitoring.error_dismissed',
      targetType: 'PlatformError',
      targetId: id,
      metadata: { service: error.service, message: error.message },
    });

    return updated;
  }

  async listHealthHistory(service: string) {
    const [items, total] = await Promise.all([
      this.prisma.healthCheckHistory.findMany({
        where: { service },
        orderBy: { checkedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          service: true,
          status: true,
          responseTimeMs: true,
          message: true,
          checkedAt: true,
        },
      }),
      this.prisma.healthCheckHistory.count({ where: { service } }),
    ]);
    return {
      items,
      meta: buildPageMeta(1, 100, total),
    };
  }

  async listSystemLogs(query: PaginationDto & { level?: string; service?: string }) {
    const { page, take } = resolvePage(query);

    const where: Record<string, unknown> = {};
    if (query.level) where.level = query.level;
    if (query.service) where.service = query.service;

    // Placeholder: System logs would typically come from a log aggregation service
    // This returns empty data with proper pagination structure
    return {
      items: [],
      meta: buildPageMeta(page, take, 0, undefined),
    };
  }
}
