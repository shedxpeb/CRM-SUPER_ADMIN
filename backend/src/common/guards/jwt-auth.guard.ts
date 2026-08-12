import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';
import { CurrentUser } from '../decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  email: string;
  sessionId: string;
  passwordVersion: number;
  permissionVersion: number;
}

/**
 * JwtAuthGuard authenticates requests with a Bearer access token.
 * On success it loads the PlatformUser (active checks) plus roles and
 * permissions from the DB and attaches them to request.user.
 * Respects @Public() routes.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('Missing bearer token');

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.prisma.platformUser.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isLocked: true,
        lockedUntil: true,
        passwordVersion: true,
        permissionVersion: true,
        roles: { select: { role: { select: { name: true, isSystem: true } } } },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');
    if (!user.isActive) throw new UnauthorizedException('User is inactive');
    if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('User is locked');
    }
    if (user.passwordVersion !== payload.passwordVersion) {
      throw new UnauthorizedException('Password has changed. Please log in again.');
    }

    const isSuperAdmin = user.roles.some((r) => r.role.name === 'SUPER_ADMIN');
    const permissions = isSuperAdmin ? ['*'] : await this.loadPermissions(user.id);

    const currentUser: CurrentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      sessionId: payload.sessionId,
      roles: user.roles.map((r) => r.role.name),
      permissions,
      passwordVersion: user.passwordVersion,
      permissionVersion: user.permissionVersion,
    };

    (request as FastifyRequest & { user?: CurrentUser }).user = currentUser;
    return true;
  }

  private extractToken(request: FastifyRequest): string | undefined {
    const auth = request.headers['authorization'];
    if (!auth) return undefined;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private async loadPermissions(userId: string): Promise<string[]> {
    const rows = await this.prisma.rolePermission.findMany({
      where: { role: { users: { some: { userId } } } },
      select: { permission: { select: { key: true } } },
    });
    return rows.map((r) => r.permission.key);
  }
}
