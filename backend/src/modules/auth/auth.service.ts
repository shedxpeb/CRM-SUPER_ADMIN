import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { AppConfigService } from '../../config/app.config';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TokenService } from './services/token.service';
import { SessionService } from './services/session.service';
import { LoginProtectionService } from './services/login-protection.service';
import { AuditService } from './services/audit.service';
import { AuthResponse, AuthUserDto } from './interfaces/auth-response.interface';
import { addDays } from '../../common/utils/date.util';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly tokenService: TokenService,
    private readonly sessionService: SessionService,
    private readonly loginProtection: LoginProtectionService,
    private readonly auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    if (await this.loginProtection.isIpBlocked(ipAddress)) {
      throw new ForbiddenException('Your IP address is blocked');
    }

    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      await this.loginProtection.recordAttempt({
        email: dto.email.toLowerCase(),
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'User not found',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.isDeleted) throw new UnauthorizedException('Invalid email or password');

    const lock = await this.loginProtection.isLocked(user.email);
    if (lock.locked) {
      await this.auditService.record({
        actorId: user.id,
        actorEmail: user.email,
        action: 'auth.login_locked',
        ipAddress,
        userAgent,
        metadata: { lockedUntil: lock.lockedUntil },
      });
      throw new ForbiddenException(
        `Account temporarily locked. Try again after ${lock.lockedUntil?.toISOString()}.`,
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.loginProtection.recordAttempt({
        email: user.email,
        userId: user.id,
        ipAddress,
        userAgent,
        success: false,
        failureReason: 'Invalid password',
      });
      await this.auditService.record({
        actorId: user.id,
        actorEmail: user.email,
        action: 'auth.login_failed',
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid password' },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      await this.auditService.record({
        actorId: user.id,
        actorEmail: user.email,
        action: 'auth.login_blocked_inactive',
        ipAddress,
        userAgent,
      });
      throw new ForbiddenException('Account is not active');
    }
    if (user.isLocked) {
      throw new ForbiddenException('Account is locked. Contact a platform administrator.');
    }

    const refresh = this.tokenService.generateRefreshToken();
    const refreshExpiresAt = addDays(new Date(), 7);

    const session = await this.sessionService.createSession({
      userId: user.id,
      refreshTokenHash: refresh.hash,
      expiresAt: refreshExpiresAt,
      userAgent,
      ipAddress,
    });

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refresh.hash,
        sessionId: session.id,
        userId: user.id,
        expiresAt: refreshExpiresAt,
      },
    });

    await this.prisma.platformUser.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: ipAddress },
    });

    await this.loginProtection.recordAttempt({
      email: user.email,
      userId: user.id,
      ipAddress,
      userAgent,
      success: true,
    });

    await this.auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      action: 'auth.login',
      ipAddress,
      userAgent,
      metadata: { sessionId: session.id },
    });

    const authUser = await this.buildAuthUser(user.id, user.email, user.name);
    return this.buildResponse(
      authUser,
      session.id,
      refresh.token,
      this.tokenService.signAccessToken({
        sub: user.id,
        email: user.email,
        sessionId: session.id,
        passwordVersion: user.passwordVersion,
        permissionVersion: user.permissionVersion,
      }),
    );
  }

  async refresh(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const tokenHash = this.tokenService.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: true, user: true },
    });

    if (!stored || stored.isRevoked) throw new UnauthorizedException('Invalid refresh token');
    if (stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    if (!stored.session.isActive) throw new UnauthorizedException('Session is inactive');

    const newRefresh = this.tokenService.generateRefreshToken();
    const newExpiry = addDays(new Date(), 7);

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { isRevoked: true, revokedAt: new Date(), replacedByTokenHash: newRefresh.hash },
      }),
      this.prisma.refreshToken.create({
        data: {
          tokenHash: newRefresh.hash,
          sessionId: stored.sessionId,
          userId: stored.userId,
          expiresAt: newExpiry,
        },
      }),
      this.prisma.platformSession.update({
        where: { id: stored.sessionId },
        data: { refreshToken: newRefresh.hash, lastActivityAt: new Date() },
      }),
    ]);

    const user = stored.user;

    await this.auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      action: 'auth.refresh',
      ipAddress,
      userAgent,
      metadata: { sessionId: stored.sessionId },
    });

    const authUser = await this.buildAuthUser(user.id, user.email, user.name);
    return this.buildResponse(
      authUser,
      stored.sessionId,
      newRefresh.token,
      this.tokenService.signAccessToken({
        sub: user.id,
        email: user.email,
        sessionId: stored.sessionId,
        passwordVersion: user.passwordVersion,
        permissionVersion: user.permissionVersion,
      }),
    );
  }

  async logout(userId: string, sessionId: string, ipAddress?: string, userAgent?: string) {
    await this.sessionService.revokeSession(sessionId);
    await this.auditService.record({
      actorId: userId,
      action: 'auth.logout',
      ipAddress,
      userAgent,
      metadata: { sessionId },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.platformUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        department: true,
        designation: true,
        isActive: true,
        isLocked: true,
        mustChangePassword: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    // Return the same flat contract as login (roles: string[], permissions:
    // string[]) so client-side guards (hasRole/can) work after hard reloads.
    const profile = await this.buildAuthUser(user.id, user.email, user.name);
    return { ...user, roles: profile.roles, permissions: profile.permissions };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const user = await this.prisma.platformUser.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Current password is incorrect');

    const hash = await bcrypt.hash(dto.newPassword, this.config.bcryptRounds);
    const newVersion = user.passwordVersion + 1;

    await this.prisma.platformUser.update({
      where: { id: userId },
      data: {
        passwordHash: hash,
        passwordVersion: newVersion,
        lastPasswordChangeAt: new Date(),
        mustChangePassword: false,
      },
    });

    await this.sessionService.revokeAllUserSessions(userId);
    await this.auditService.record({
      actorId: userId,
      actorEmail: user.email,
      action: 'auth.password_changed',
      ipAddress,
      userAgent,
      metadata: { passwordVersion: newVersion },
    });

    return { message: 'Password changed. All other sessions have been logged out.' };
  }

  async forgotPassword(dto: ForgotPasswordDto, ipAddress?: string) {
    const user = await this.prisma.platformUser.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    // Always return success to avoid user enumeration.
    if (!user) return { message: 'If the account exists, a reset link has been sent.' };

    const token = this.tokenService.signPasswordResetToken({
      sub: user.id,
      email: user.email,
      purpose: 'password-reset',
    });

    await this.auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      action: 'auth.password_reset_requested',
      ipAddress,
    });

    // Email delivery is wired to the mail provider in production; log the link in dev.
    this.logger.log(`Password reset link for ${user.email}: ${token}`);

    return { message: 'If the account exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto, ipAddress?: string) {
    let payload;
    try {
      payload = this.tokenService.verifyPasswordResetToken(dto.token);
    } catch {
      throw new BadRequestException('Invalid or expired reset token');
    }
    if (payload.purpose !== 'password-reset') {
      throw new BadRequestException('Invalid reset token');
    }

    const user = await this.prisma.platformUser.findUnique({ where: { id: payload.sub } });
    if (!user) throw new BadRequestException('Account not found');

    const hash = await bcrypt.hash(dto.newPassword, this.config.bcryptRounds);
    const newVersion = user.passwordVersion + 1;

    await this.prisma.platformUser.update({
      where: { id: user.id },
      data: {
        passwordHash: hash,
        passwordVersion: newVersion,
        lastPasswordChangeAt: new Date(),
        mustChangePassword: false,
        loginAttempts: 0,
        isLocked: false,
        lockedUntil: null,
      },
    });

    await this.sessionService.revokeAllUserSessions(user.id);
    await this.auditService.record({
      actorId: user.id,
      actorEmail: user.email,
      action: 'auth.password_reset',
      ipAddress,
      metadata: { passwordVersion: newVersion },
    });

    return { message: 'Password reset successfully. Please log in again.' };
  }

  private async buildAuthUser(userId: string, email: string, name: string): Promise<AuthUserDto> {
    const roles = await this.prisma.platformUserRole.findMany({
      where: { userId },
      select: { role: { select: { name: true } } },
    });
    const roleNames = roles.map((r) => r.role.name);
    const permissions = roleNames.includes('SUPER_ADMIN')
      ? ['*']
      : (
          await this.prisma.rolePermission.findMany({
            where: { role: { users: { some: { userId } } } },
            select: { permission: { select: { key: true } } },
          })
        ).map((r) => r.permission.key);
    return { id: userId, email, name, roles: roleNames, permissions };
  }

  private buildResponse(
    user: AuthUserDto,
    sessionId: string,
    refreshToken: string,
    accessToken: string,
  ): AuthResponse {
    return {
      accessToken,
      refreshToken,
      expiresIn: 1800,
      sessionId,
      user,
    };
  }
}
