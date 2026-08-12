import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FastifyReply } from 'fastify';

/**
 * Adds the API version header (X-API-Version) and an optional deprecation
 * header to every response.
 */
@Injectable()
export class VersionHeaderInterceptor implements NestInterceptor {
  private readonly version = 'v1';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<FastifyReply>();
    return next.handle().pipe(
      map((data) => {
        if (typeof res?.header === 'function') {
          res.header('X-API-Version', this.version);
        }
        return data;
      }),
    );
  }
}
