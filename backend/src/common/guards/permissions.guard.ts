import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ALLOW_AUTHENTICATED_KEY } from '../decorators/allow-authenticated.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';

/**
 * PermissionsGuard enforces @RequirePermissions(...) metadata (default-deny).
 * Routes without declared permissions are denied unless @Public() or
 * @AllowAuthenticated() (self-service endpoints).
 * SUPER_ADMIN (wildcard '*') short-circuits to allow.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const allowAuthenticated = this.reflector.getAllAndOverride<boolean>(ALLOW_AUTHENTICATED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (allowAuthenticated) return true;

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Fail-closed: no declared permission => denied.
    if (!required || required.length === 0) {
      throw new ForbiddenException('No permission declared for this route (default-deny)');
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { user?: CurrentUser }>();
    const user = request.user;
    if (!user) throw new ForbiddenException('Unauthenticated');

    if (user.permissions.includes('*')) return true;

    const granted = user.permissions.some((p) => required.includes(p));
    if (!granted) {
      throw new ForbiddenException(`Missing required permission(s): ${required.join(', ')}`);
    }
    return true;
  }
}
