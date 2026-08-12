import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';
import {
  CreateBlockedIpDto,
  ListBlockedIpsDto,
  ListSessionsDto,
  ListLoginAttemptsDto,
} from './dto/security.dto';

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ── Blocked IPs ─────────────────────────────────────────────────────────────

  async listBlockedIps(dto: ListBlockedIpsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.active !== undefined) where.isActive = dto.active;

    const [items, total] = await Promise.all([
      this.prisma.blockedIp.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          ipAddress: true,
          reason: true,
          blockedUntil: true,
          isActive: true,
          createdAt: true,
          unblockedAt: true,
        },
      }),
      this.prisma.blockedIp.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async blockIp(dto: CreateBlockedIpDto, actor: { id: string; email: string }) {
    const ip = await this.prisma.blockedIp.upsert({
      where: { ipAddress: dto.ipAddress },
      update: {
        reason: dto.reason,
        blockedUntil: dto.blockedUntil ? new Date(dto.blockedUntil) : null,
        isActive: true,
        unblockedAt: null,
      },
      create: {
        ipAddress: dto.ipAddress,
        reason: dto.reason,
        blockedUntil: dto.blockedUntil ? new Date(dto.blockedUntil) : null,
        blockedById: actor.id,
        isActive: true,
      },
    });
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'blocked_ips.block',
      targetType: 'BlockedIp',
      targetId: ip.id,
      metadata: { ipAddress: dto.ipAddress, reason: dto.reason },
    });
    return ip;
  }

  async unblockIp(id: string, actor: { id: string; email: string }) {
    const ip = await this.prisma.blockedIp.findUnique({ where: { id } });
    if (!ip) throw new NotFoundException('Blocked IP not found');
    const updated = await this.prisma.blockedIp.update({
      where: { id },
      data: { isActive: false, unblockedAt: new Date() },
    });
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'blocked_ips.unblock',
      targetType: 'BlockedIp',
      targetId: id,
      metadata: { ipAddress: updated.ipAddress },
    });
    return { success: true, message: 'IP unblocked' };
  }

  // ── Sessions ────────────────────────────────────────────────────────────────

  async listSessions(dto: ListSessionsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.active !== undefined) where.isActive = dto.active;
    if (dto.userId) where.userId = dto.userId;

    const [items, total] = await Promise.all([
      this.prisma.platformSession.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          userId: true,
          deviceInfo: true,
          userAgent: true,
          ipAddress: true,
          location: true,
          isActive: true,
          lastActivityAt: true,
          expiresAt: true,
          createdAt: true,
          revokedAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      this.prisma.platformSession.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }

  async revokeSession(id: string, actor: { id: string; email: string }) {
    const session = await this.prisma.platformSession.findUnique({ where: { id } });
    if (!session) throw new NotFoundException('Session not found');
    await this.prisma.$transaction([
      this.prisma.platformSession.updateMany({
        where: { id, isActive: true },
        data: { isActive: false, revokedAt: new Date(), revokedById: actor.id },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId: id },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);
    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'sessions.revoke',
      targetType: 'PlatformSession',
      targetId: id,
      metadata: { userId: session.userId },
    });
    return { success: true, message: 'Session revoked' };
  }

  // ── Login attempts ──────────────────────────────────────────────────────────

  async listLoginAttempts(dto: ListLoginAttemptsDto) {
    const { page, skip, take } = resolvePage(dto);
    const where: Record<string, unknown> = {};
    if (dto.userId) where.userId = dto.userId;
    if (dto.email) where.email = { contains: dto.email, mode: 'insensitive' };
    if (dto.success !== undefined) where.success = dto.success;

    const [items, total] = await Promise.all([
      this.prisma.loginAttempt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          userId: true,
          ipAddress: true,
          userAgent: true,
          success: true,
          failureReason: true,
          createdAt: true,
          user: { select: { id: true, email: true, name: true } },
        },
      }),
      this.prisma.loginAttempt.count({ where }),
    ]);
    return { items, meta: buildPageMeta(page, take, total, dto.sort) };
  }
}
