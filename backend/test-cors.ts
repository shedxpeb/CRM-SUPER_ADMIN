import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import fastify from 'fastify';
import { AppModule } from './src/app.module';
import { ConfigService } from '@nestjs/config';

async function test() {
  const fastifyInstance = fastify();

  fastifyInstance.addHook('onRequest', async (req, reply) => {
    if (req.method === 'OPTIONS') {
      reply.code(204).send();
    }
  });

  const adapter = new FastifyAdapter(fastifyInstance);

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
    logger: ['error', 'warn'],
  });

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('frontendUrl', 'http://localhost:3000');

  await app.register(cors as any, {
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  });

  await app.register(cookie as any, {
    secret: configService.get<string>('jwt.secret') || 'test-secret',
  });

  await app.init();

  console.log('=== Registered Routes ===');
  console.log(fastifyInstance.printRoutes());

  // Test OPTIONS /auth/login
  const optLogin = await fastifyInstance.inject({
    method: 'OPTIONS',
    url: '/auth/login',
    headers: {
      origin: 'http://localhost:3001',
      'access-control-request-method': 'POST',
    },
  });
  console.log('\n=== OPTIONS /auth/login ===');
  console.log('Status:', optLogin.statusCode);
  console.log('Headers:', JSON.stringify(optLogin.headers, null, 2));
  console.log('Body:', optLogin.body);

  // Test POST /auth/login
  const postLogin = await fastifyInstance.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { email: 'admin@pebcrm.com', password: 'Admin@123' },
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3001' },
  });
  console.log('\n=== POST /auth/login ===');
  console.log('Status:', postLogin.statusCode);
  console.log('Headers:', JSON.stringify(postLogin.headers, null, 2));
  console.log('Body:', postLogin.body);

  await app.close();
}

test().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});