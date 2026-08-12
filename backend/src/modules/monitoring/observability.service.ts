import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';
import { ListApiLogsDto, ListSlowQueriesDto, ListSystemLogsDto } from './dto/observability.dto';

@Injectable()
export class ObservabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async listApiLogs(dto: ListApiLogsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.method) where.method = dto.method.toUpperCase();
    if (dto.path) where.path = { contains: dto.path };
    if (dto.statusCode) where.statusCode = dto.statusCode;
    if (dto.userId) where.userId = dto.userId;
    if (dto.correlationId) where.correlationId = dto.correlationId;
    if (dto.requestId) where.requestId = dto.requestId;

    const [items, total] = await Promise.all([
      this.prisma.apiLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          method: true,
          path: true,
          statusCode: true,
          responseTimeMs: true,
          ipAddress: true,
          userId: true,
          tenantId: true,
          requestId: true,
          correlationId: true,
          error: true,
          createdAt: true,
        },
      }),
      this.prisma.apiLog.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async listSlowQueries(dto: ListSlowQueriesDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.minDurationMs) where.durationMs = { gte: dto.minDurationMs };

    const [items, total] = await Promise.all([
      this.prisma.slowQueryLog.findMany({
        where,
        orderBy: { durationMs: 'desc' },
        skip,
        take,
        select: {
          id: true,
          database: true,
          query: true,
          durationMs: true,
          executedBy: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.slowQueryLog.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  /**
   * Distributed trace for a correlation id: surfaces the API log entries and
   * audit entries that share the correlation id, in chronological order.
   */
  async traceCorrelation(correlationId: string) {
    const [apiLogs, auditLogs] = await Promise.all([
      this.prisma.apiLog.findMany({
        where: { correlationId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          method: true,
          path: true,
          statusCode: true,
          responseTimeMs: true,
          userId: true,
          tenantId: true,
          requestId: true,
          correlationId: true,
          error: true,
          createdAt: true,
        },
      }),
      this.prisma.platformAuditLog.findMany({
        where: { correlationId },
        orderBy: { createdAt: 'asc' },
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
          requestId: true,
          correlationId: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      correlationId,
      apiLogs,
      auditLogs,
    };
  }

  async listSystemLogs(dto: ListSystemLogsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.level) where.level = dto.level;
    if (dto.component) where.component = { contains: dto.component, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          component: true,
          level: true,
          message: true,
          metadata: true,
          createdAt: true,
        },
      }),
      this.prisma.systemLog.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }
}
