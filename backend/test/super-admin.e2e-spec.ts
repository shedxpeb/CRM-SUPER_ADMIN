import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { GlobalValidationPipe } from '../src/common/pipes/validation.pipe';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { LoggingInterceptor } from '../src/common/interceptors/logging.interceptor';

const TEST_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@pebcrm.com';
const TEST_PASSWORD =
  process.env.SUPER_ADMIN_PASSWORD ||
  (() => {
    throw new Error('SUPER_ADMIN_PASSWORD env is required for e2e tests');
  })();
const FRONTEND_URL = 'http://localhost:3001';

describe('Super Admin E2E', () => {
  let app: NestFastifyApplication;
  let fastifyInstance: ReturnType<typeof fastify>;
  let authToken: string;

  beforeAll(async () => {
    fastifyInstance = fastify();

    // Must be added BEFORE NestFactory.create so it runs before middie
    fastifyInstance.addHook('onRequest', async (req, reply) => {
      if (req.method === 'OPTIONS') {
        reply.code(204).send();
      }
    });

    const adapter = new FastifyAdapter(fastifyInstance);

    app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
      bufferLogs: true,
      logger: ['error', 'warn'],
    });

    const configService = app.get(ConfigService);

    app.useGlobalPipes(new GlobalValidationPipe());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

    const frontendUrl = configService.get<string>('frontendUrl', FRONTEND_URL);
    await app.register(cors as unknown as Parameters<typeof app.register>[0], {
      origin: frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
    });

    await app.register(cookie as unknown as Parameters<typeof app.register>[0], {
      secret: configService.get<string>('jwt.secret') || 'test-secret',
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const inject = (method: string, url: string, opts: Record<string, unknown> = {}) =>
    fastifyInstance.inject({ method, url, ...opts });

  // ── 1. HEALTH ────────────────────────────────────────────
  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await inject('GET', '/health');
      expect(res.statusCode).toBe(200);
    });

    it('GET /health/modules should return 200', async () => {
      const res = await inject('GET', '/health/modules');
      expect(res.statusCode).toBe(200);
    });
  });

  // ── 2. CORS PREFLIGHT ────────────────────────────────────
  describe('CORS Preflight', () => {
    it('OPTIONS /auth/login should return 204', async () => {
      const res = await inject('OPTIONS', '/auth/login', {
        headers: {
          origin: FRONTEND_URL,
          'access-control-request-method': 'POST',
        },
      });
      expect(res.statusCode).toBe(204);
    });
  });

  // ── 3. AUTH - LOGIN ──────────────────────────────────────
  describe('Auth Login', () => {
    it('POST /auth/login with empty body should return 400', async () => {
      const res = await inject('POST', '/auth/login', {
        payload: {},
        headers: { 'content-type': 'application/json' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('POST /auth/login with wrong password should return 401', async () => {
      const res = await inject('POST', '/auth/login', {
        payload: { email: TEST_EMAIL, password: 'wrongpassword' },
        headers: { 'content-type': 'application/json' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('POST /auth/login with correct credentials should succeed and return token', async () => {
      const res = await inject('POST', '/auth/login', {
        payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
        headers: { 'content-type': 'application/json' },
      });
      expect(res.statusCode).toBe(201);

      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();

      const data = body.data;
      expect(data.accessToken).toBeDefined();
      expect(typeof data.accessToken).toBe('string');
      expect(data.accessToken.length).toBeGreaterThan(0);

      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(TEST_EMAIL);
      expect(data.user.role).toBe('SUPER_ADMIN');

      authToken = data.accessToken;
    });
  });

  // ── 4. AUTH - GET PROFILE ────────────────────────────────
  describe('Auth Profile', () => {
    it('GET /auth/me without token should return 401', async () => {
      const res = await inject('GET', '/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('GET /auth/me with valid token should return user profile', async () => {
      const res = await inject('GET', '/auth/me', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);

      const body = JSON.parse(res.body);
      expect(body.data.email).toBe(TEST_EMAIL);
      expect(body.data.role).toBe('SUPER_ADMIN');
    });
  });

  // ── 5. PROTECTED ROUTES ──────────────────────────────────
  describe('Protected Routes', () => {
    it('GET /users should return 200 with valid token', async () => {
      const res = await inject('GET', '/users', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
    });

    it('GET /organization should return 200 with valid token', async () => {
      const res = await inject('GET', '/organization', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── 6. LOGOUT ────────────────────────────────────────────
  describe('Logout', () => {
    it('POST /auth/logout should succeed', async () => {
      const res = await inject('POST', '/auth/logout', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(201);
    });

    it('Old token should be invalid after logout', async () => {
      const res = await inject('GET', '/auth/me', {
        headers: { authorization: `Bearer ${authToken}` },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
