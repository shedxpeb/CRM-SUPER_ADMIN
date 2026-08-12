import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AppConfigService } from '../../../config/app.config';
import { addMinutes, isPast } from '../../../common/utils/date.util';

export interface RecordAttemptInput {
  email: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  failureReason?: string;
}

export interface LockStatus {
  locked: boolean;
  lockedUntil?: Date;
}

/**
 * LoginProtectionService implements the lockout policy (threshold within a
 * window) and IP blocking. LoginAttempt rows are append-only.
 */
@Injectable()
export class LoginProtectionService {
  private readonly logger = new Logger(LoginProtectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async recordAttempt(input: RecordAttemptInput): Promise<void> {
    await this.prisma.loginAttempt.create({
      data: {
        email: input.email,
        userId: input.userId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        success: input.success,
        failureReason: input.failureReason,
      },
    });

    if (input.success && input.userId) {
      await this.prisma.platformUser.update({
        where: { id: input.userId },
        data: { loginAttempts: 0, isLocked: false, lockedUntil: null },
      });
      return;
    }

    if (!input.success && input.userId) {
      const user = await this.prisma.platformUser.findUnique({
        where: { id: input.userId },
        select: { loginAttempts: true },
      });
      if (!user) return;
      const attempts = user.loginAttempts + 1;
      if (attempts >= this.config.lockThreshold) {
        const lockedUntil = addMinutes(new Date(), this.config.lockDurationMinutes);
        this.logger.warn(`Account locked for ${input.email} until ${lockedUntil.toISOString()}`);
        await this.prisma.platformUser.update({
          where: { id: input.userId },
          data: { loginAttempts: attempts, isLocked: true, lockedUntil },
        });
      } else {
        await this.prisma.platformUser.update({
          where: { id: input.userId },
          data: { loginAttempts: attempts },
        });
      }
    }
  }

  async isLocked(email: string): Promise<LockStatus> {
    const user = await this.prisma.platformUser.findUnique({
      where: { email },
      select: { isLocked: true, lockedUntil: true },
    });
    if (user && user.isLocked && user.lockedUntil && !isPast(user.lockedUntil)) {
      return { locked: true, lockedUntil: user.lockedUntil };
    }
    return { locked: false };
  }

  async blockIp(ipAddress: string, reason?: string, blockedById?: string): Promise<void> {
    const existing = await this.prisma.blockedIp.findUnique({
      where: { ipAddress },
    });
    if (existing) {
      await this.prisma.blockedIp.update({
        where: { id: existing.id },
        data: { reason, isActive: true, blockedUntil: null, unblockedAt: null },
      });
      return;
    }
    await this.prisma.blockedIp.create({
      data: { ipAddress, reason, blockedById, isActive: true },
    });
  }

  async isIpBlocked(ipAddress?: string): Promise<boolean> {
    if (!ipAddress) return false;
    const row = await this.prisma.blockedIp.findFirst({
      where: { ipAddress, isActive: true },
    });
    if (!row) return false;
    if (row.blockedUntil && isPast(row.blockedUntil)) return false;
    return true;
  }
}
