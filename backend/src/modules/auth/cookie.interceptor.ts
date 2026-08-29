import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { Observable, map } from 'rxjs';
import { FastifyReply } from 'fastify';

@Injectable()
export class AuthCookieInterceptor implements NestInterceptor {
  constructor(private readonly config: NestConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    const name = process.env.COOKIE_REFRESH_NAME || 'refreshToken';
    const path = process.env.COOKIE_PATH || '/';
    const sameSite = (process.env.COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict' | 'none';
    const secure =
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === 'true'
        : process.env.NODE_ENV === 'production';

    return next.handle().pipe(
      map((data: Record<string, unknown>) => {
        if (typeof data?.refreshToken === 'string') {
          const maxAge = 10 * 24 * 60 * 60;
          res.setCookie(name, data.refreshToken, {
            path,
            httpOnly: true,
            secure,
            sameSite,
            maxAge,
          });
          const rest = { ...data };
          delete rest.refreshToken;
          return rest;
        }
        if (data?.clearRefreshCookie) {
          res.clearCookie(name, { path, httpOnly: true, secure, sameSite });
          const rest = { ...data };
          delete rest.clearRefreshCookie;
          return Object.keys(rest).length
            ? rest
            : { message: data.message ?? 'Logged out successfully.' };
        }
        return data;
      }),
    );
  }
}
