import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { SecurityService } from './security.service';
import {
  CreateBlockedIpDto,
  ListBlockedIpsDto,
  ListSessionsDto,
  ListLoginAttemptsDto,
} from './dto/security.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('security')
@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // ── Blocked IPs ─────────────────────────────────────────────────────────────

  @Get('blocked-ips')
  @RequirePermissions('security:manage')
  @ApiOperation({ summary: 'List blocked IPs' })
  listBlockedIps(@Req() req: FastifyRequest & { query: ListBlockedIpsDto }) {
    return this.securityService.listBlockedIps(req.query);
  }

  @Post('blocked-ips')
  @RequirePermissions('security:manage')
  @ApiOperation({ summary: 'Block an IP address' })
  blockIp(@Body() dto: CreateBlockedIpDto, @CurrentUser() actor: CurrentUser) {
    return this.securityService.blockIp(dto, { id: actor.id, email: actor.email });
  }

  @Post('blocked-ips/:id/unblock')
  @RequirePermissions('security:manage')
  @ApiOperation({ summary: 'Unblock an IP address' })
  unblockIp(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.securityService.unblockIp(id, { id: actor.id, email: actor.email });
  }

  // ── Sessions ────────────────────────────────────────────────────────────────

  @Get('sessions')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'List platform sessions' })
  listSessions(@Req() req: FastifyRequest & { query: ListSessionsDto }) {
    return this.securityService.listSessions(req.query);
  }

  @Post('sessions/:id/revoke')
  @RequirePermissions('security:manage')
  @ApiOperation({ summary: 'Revoke a platform session' })
  revokeSession(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.securityService.revokeSession(id, { id: actor.id, email: actor.email });
  }

  // ── Login attempts ──────────────────────────────────────────────────────────

  @Get('login-attempts')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'List login attempts' })
  listLoginAttempts(@Req() req: FastifyRequest & { query: ListLoginAttemptsDto }) {
    return this.securityService.listLoginAttempts(req.query);
  }
}
