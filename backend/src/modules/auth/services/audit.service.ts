import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AuditSeverity } from '@prisma/client';

export interface AuditEntry {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: AuditSeverity;
  requestId?: string;
  correlationId?: string;
  tenantId?: string;
}

/**
 * AuditService writes append-only PlatformAuditLog rows. Called from within
 * the same transaction as the mutation whenever possible (ACID guarantee).
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.prisma.platformAuditLog.create({
      data: {
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        action: entry.action,
        targetType: entry.targetType,
        targetId: entry.targetId,
        targetName: entry.targetName,
        metadata: (entry.metadata ?? {}) as object,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        severity: entry.severity ?? 'INFO',
        requestId: entry.requestId,
        correlationId: entry.correlationId,
        tenantId: entry.tenantId,
      },
    });
  }
}
