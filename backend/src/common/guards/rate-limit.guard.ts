import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { AppConfigService } from '../../config/app.config';

interface WindowCounter {
  startedAt: number;
  count: number;
}

/**
 * In-memory fixed-window rate limiter (per-IP or per-user).
 * Suitable for a single instance; swap for a Redis-based limiter
 * when horizontally scaling.
 *
 * Includes periodic cleanup to prevent memory leaks from stale entries
 * accumulating under sustained traffic.
 */
@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly windows = new Map<string, WindowCounter>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly config: AppConfigService) {
    // Purge expired windows every 60 seconds to prevent unbounded memory growth.
    // On a single-instance deployment with ~2000 users, stale entries from
    // churned IPs would otherwise accumulate indefinitely.
    this.cleanupTimer = setInterval(() => this.cleanup(), 60_000);
  }

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

  /**
   * Remove expired windows. Runs on a timer to prevent memory leaks.
   * The Map is bounded by the number of unique keys seen within a single
   * TTL window — typically well under 10K entries for a 2000-user deployment.
   */
  private cleanup() {
    const now = Date.now();
    const ttlMs = this.config.rateLimitTtlSeconds * 1000;
    let purged = 0;
    for (const [key, window] of this.windows) {
      if (now - window.startedAt >= ttlMs) {
        this.windows.delete(key);
        purged++;
      }
    }
    if (purged > 0) {
      this.logger.debug(`Rate limiter cleanup: purged ${purged} expired entries, ${this.windows.size} active`);
    }
  }

  onModuleDestroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  private keyFor(request: FastifyRequest): string {
    const user = (request as FastifyRequest & { user?: { id: string } }).user;
    return user ? `user:${user.id}` : `ip:${request.ip || 'unknown'}`;
  }
}
