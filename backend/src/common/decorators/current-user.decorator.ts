import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  sessionId: string;
  roles: string[];
  permissions: string[];
  passwordVersion: number;
  permissionVersion: number;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user?: CurrentUser }>();
    const user = request.user;
    if (!user) return undefined;
    return data ? user[data] : user;
  },
);
