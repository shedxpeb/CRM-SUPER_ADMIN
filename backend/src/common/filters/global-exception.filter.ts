import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';
import { ErrorCodes } from '../constants/error-codes.constants';

/**
 * Catch-all filter for non-HTTP exceptions (unhandled errors, DB errors).
 * Logs with request context and returns 500 with the standard error body.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply | ServerResponse>();
    const req = ctx.getRequest<FastifyRequest & { requestId?: string }>();
    const requestId = req.requestId || 'unknown';
    const message = exception instanceof Error ? exception.message : 'Internal server error';

    this.logger.error(
      `${req.method} ${req.url} [500] ${message} (${requestId})`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body = {
      code: ErrorCodes.INTERNAL_ERROR,
      message,
      requestId,
      path: req.url,
      timestamp: new Date().toISOString(),
    };

    if (typeof (res as FastifyReply).code === 'function') {
      (res as FastifyReply).code(HttpStatus.INTERNAL_SERVER_ERROR).send(body);
    } else {
      const raw = res as ServerResponse;
      raw.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      raw.setHeader('Content-Type', 'application/json');
      raw.end(JSON.stringify(body));
    }
  }
}
