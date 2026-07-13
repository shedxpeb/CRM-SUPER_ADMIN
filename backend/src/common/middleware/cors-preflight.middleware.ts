import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { ServerResponse } from 'http';

@Injectable()
export class CorsPreflightMiddleware implements NestMiddleware {
  use(req: FastifyRequest, res: ServerResponse, next: () => void) {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant-ID');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.statusCode = 204;
      res.end();
      return;
    }
    next();
  }
}
