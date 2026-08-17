import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { randomUUID } from 'crypto';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from './config/app.config';
import { AppModule } from './app.module';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { isOriginAllowed, parseAllowedOrigins } from './common/cors/allowed-origins';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);

  app.setGlobalPrefix(config.globalPrefix);
  app.useGlobalPipes(new GlobalValidationPipe());

  // Request tracing on the Fastify request object (visible to guards/interceptors).
  const fastify = app.getHttpAdapter().getInstance() as FastifyInstance;

  // Tolerate empty JSON bodies (e.g. POST/DELETE with content-type json and no body).
  app.useBodyParser('application/json', {}, (req, body, done) => {
    try {
      const raw = Buffer.isBuffer(body) ? body.toString('utf8') : String(body ?? '');
      done(null, raw.trim() === '' ? {} : JSON.parse(raw));
    } catch (err) {
      done(err as Error, undefined);
    }
  });

  fastify.addHook('onRequest', async (req, reply) => {
    const header = req.headers['x-request-id'];
    const requestId = (Array.isArray(header) ? header[0] : header) || randomUUID();
    const corrHeader = req.headers['x-correlation-id'];
    const correlationId = (Array.isArray(corrHeader) ? corrHeader[0] : corrHeader) || randomUUID();
    (req as FastifyRequest & { requestId?: string }).requestId = requestId;
    (req as FastifyRequest & { correlationId?: string }).correlationId = correlationId;
    reply.header('X-Request-Id', requestId);
    reply.header('X-Correlation-Id', correlationId);
  });

  const corsAllowedOrigins = parseAllowedOrigins(config.allowedOrigins);
  const allowVercelPreview = config.allowVercelPreview;

  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (isOriginAllowed(origin, corsAllowedOrigins, { allowVercelApp: allowVercelPreview })) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Correlation-ID',
      'Idempotency-Key',
    ],
  });

  console.log(
    `CORS allowed origins: ${corsAllowedOrigins.join(', ') || '(none)'}` +
      (allowVercelPreview ? ' (+ any *.vercel.app)' : ''),
  );

  await app.register(cookie, {
    secret: config.jwtSecret || 'dev-cookie-secret',
  });

  // Expose Swagger only outside production (internal API documentation must not be public).
  if (config.nodeEnv !== 'production') {
    const swagger = new DocumentBuilder()
      .setTitle('PEB SUPER-ADMIN Platform API')
      .setDescription('Enterprise control plane API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('health', 'Health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swagger);
    SwaggerModule.setup('api-docs', app, document);
  }

  await app.listen(config.port, '0.0.0.0');

  console.log(`SUPER-ADMIN API running on http://localhost:${config.port}/${config.globalPrefix}`);
}
bootstrap();
