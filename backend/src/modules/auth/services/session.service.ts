import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AppConfigService } from '../../../config/app.config';

export interface CreateSessionInput {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
  location?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async createSession(input: CreateSessionInput) {
    return this.prisma.platformSession.create({
      data: {
        userId: input.userId,
        refreshToken: input.refreshTokenHash,
        deviceInfo: input.deviceInfo,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        location: input.location,
        expiresAt: input.expiresAt,
        isActive: true,
      },
    });
  }

  async touchSession(sessionId: string): Promise<void> {
    await this.prisma.platformSession.update({
      where: { id: sessionId },
      data: { lastActivityAt: new Date() },
    });
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.platformSession.updateMany({
        where: { id: sessionId, isActive: true },
        data: { isActive: false, revokedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sessionId },
        data: { isRevoked: true, revokedAt: new Date() },
      }),
    ]);
  }

  async revokeAllUserSessions(userId: string, exceptSessionId?: string): Promise<void> {
    const where = exceptSessionId ? { userId, id: { not: exceptSessionId } } : { userId };
    await this.prisma.platformSession.updateMany({
      where,
      data: { isActive: false, revokedAt: new Date() },
    });
    await this.prisma.refreshToken.updateMany({
      where: { userId, ...(exceptSessionId ? { sessionId: { not: exceptSessionId } } : {}) },
      data: { isRevoked: true, revokedAt: new Date() },
    });
  }

  async expireOldSessions(userId: string, maxSessions = 10): Promise<void> {
    const sessions = await this.prisma.platformSession.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    const excess = sessions.slice(maxSessions);
    if (excess.length === 0) return;
    await this.prisma.platformSession.updateMany({
      where: { id: { in: excess.map((s) => s.id) } },
      data: { isActive: false, revokedAt: new Date() },
    });
  }
}
