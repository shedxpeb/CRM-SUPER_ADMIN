import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppConfigService } from '../../config/app.config';

interface WindowCounter {
  startedAt: number;
  count: number;
}

/**
 * In-memory fixed-window rate limiter (per-IP). Suitable for a single instance;
 * swap for a Redis-based limiter when horizontally scaling (architecture allows).
 * Returns 429 with the standard error code.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, WindowCounter>();

  constructor(private readonly config: AppConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const key = this.keyFor(request);
    const ttlMs = this.config.rateLimitTtlSeconds * 1000;
    const limit = this.config.rateLimitLimit;

    const now = Date.now();
    const window = this.windows.get(key);
    if (!window || now - window.startedAt >= ttlMs) {
      this.windows.set(key, { startedAt: now, count: 1 });
      return true;
    }

    window.count += 1;
    if (window.count > limit) {
      throw new HttpException(
        {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
          retryAfterSeconds: Math.ceil((window.startedAt + ttlMs - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private keyFor(request: FastifyRequest): string {
    const user = (request as FastifyRequest & { user?: { id: string } }).user;
    return user ? `user:${user.id}` : `ip:${request.ip || 'unknown'}`;
  }
}
