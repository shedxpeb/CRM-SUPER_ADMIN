import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { FastifyRequest } from 'fastify';
import { PaginationResponse } from '../interfaces/pagination-response.interface';

export interface ApiResponse<T> {
  success: boolean;
  requestId: string;
  timestamp: string;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Envelopes every successful response:
 * { success, requestId, timestamp, message, data, meta? }.
 * When a controller returns a PaginationResponse, meta carries page/pageSize/total.
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest<FastifyRequest & { requestId?: string }>();
    const requestId = request.requestId || 'unknown';

    return next.handle().pipe(
      map((data) => {
        let payload = data;
        let meta: Record<string, unknown> | undefined;

        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          const paginated = data as PaginationResponse<unknown>;
          payload = paginated.items;
          meta = paginated.meta as unknown as Record<string, unknown>;
        }

        return {
          success: true,
          requestId,
          timestamp: new Date().toISOString(),
          message: 'Success',
          data: payload,
          meta,
        };
      }),
    );
  }
}
