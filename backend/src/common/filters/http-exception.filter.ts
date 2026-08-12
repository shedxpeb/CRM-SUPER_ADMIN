import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { ErrorCodes } from '../constants/error-codes.constants';

/**
 * Global exception filter producing the standard error body:
 * { code, message, details?, requestId, path, timestamp }
 * 400 validation | 401 | 403 RBAC | 404 | 409 conflict/optimistic lock |
 * 422 domain rule | 429 rate limit | 500
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply | ServerResponse>();
    const req = ctx.getRequest<FastifyRequest & { requestId?: string }>();
    const status = exception.getStatus();
    const requestId = req.requestId || 'unknown';
    const response = exception.getResponse();

    let code: string = ErrorCodes.INTERNAL_ERROR;
    let message = exception.message;
    let details: unknown;

    if (typeof response === 'string') {
      message = response;
    } else if (typeof response === 'object' && response !== null) {
      const obj = response as Record<string, unknown>;
      code = (obj.code as string) || this.mapStatusToCode(status);
      if (Array.isArray(obj.message)) {
        details = obj.message;
        message = (obj.message as string[]).join(', ');
      } else if (obj.message) {
        message = String(obj.message);
      }
      if (obj.details) details = obj.details;
    }

    this.logger.error(`${req.method} ${req.url} [${status}] ${code} - ${message} (${requestId})`);

    const body = {
      code,
      message,
      details,
      requestId,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    if (typeof res !== 'undefined' && typeof (res as FastifyReply).code === 'function') {
      (res as FastifyReply).code(status).send(body);
    } else {
      const raw = res as ServerResponse;
      raw.statusCode = status;
      raw.setHeader('Content-Type', 'application/json');
      raw.end(JSON.stringify(body));
    }
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCodes.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCodes.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCodes.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCodes.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCodes.CONFLICT;
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return ErrorCodes.DOMAIN_RULE_VIOLATION;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCodes.RATE_LIMITED;
      default:
        return ErrorCodes.INTERNAL_ERROR;
    }
  }
}
