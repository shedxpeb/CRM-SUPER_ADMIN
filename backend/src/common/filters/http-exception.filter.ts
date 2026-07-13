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

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<FastifyReply | ServerResponse>();
    const req = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException ? exception.message : 'Internal server error';

    const requestId = (req as any).requestId || 'unknown';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        if (responseObj.message && Array.isArray(responseObj.message)) {
          this.logger.error(
            `${req.method} ${req.url} - RequestId: ${requestId} - Status: ${status} - Validation Errors: ${JSON.stringify(responseObj.message)}`,
          );
          message = responseObj.message.join(', ');
        } else if (responseObj.message) {
          this.logger.error(
            `${req.method} ${req.url} - RequestId: ${requestId} - Status: ${status} - Error Details: ${JSON.stringify(responseObj)}`,
          );
        }
      }
    }

    this.logger.error(
      `${req.method} ${req.url} - RequestId: ${requestId} - Status: ${status} - Message: ${message}`,
    );

    if (exception instanceof Error) {
      this.logger.error(`STACK: ${exception.stack}`);
      this.logger.error(`NAME: ${exception.name}`);
      this.logger.error(`FULL: ${JSON.stringify(exception, Object.getOwnPropertyNames(exception))}`);
    }

    const body: Record<string, any> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: req.url,
      requestId,
      message,
    };

    if (exception instanceof Error) {
      body.errorName = exception.name;
      body.errorStack = exception.stack?.split('\n').slice(0, 6).join('\\n');
    }

    if ('code' in res && typeof res.code === 'function') {
      (res as FastifyReply).code(status).send(body);
    } else {
      const raw = res as ServerResponse;
      raw.statusCode = status;
      raw.setHeader('Content-Type', 'application/json');
      raw.end(JSON.stringify(body));
    }
  }
}
