import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { MonitoringService } from './monitoring.service';
import { ListAuditLogsDto, ListErrorsDto } from './dto/monitoring.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('monitoring')
@Controller()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('audit-logs')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'List audit logs' })
  listAuditLogs(@Req() req: FastifyRequest & { query: ListAuditLogsDto }) {
    return this.monitoringService.listAuditLogs(req.query);
  }

  @Get('audit-logs/:id')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get an audit log entry' })
  findAuditLog(@Param('id') id: string) {
    return this.monitoringService.findAuditLog(id);
  }

  @Get('errors')
  @RequirePermissions('errors:read')
  @ApiOperation({ summary: 'List platform errors' })
  listErrors(@Req() req: FastifyRequest & { query: ListErrorsDto }) {
    return this.monitoringService.listErrors(req.query);
  }

  @Get('errors/:id')
  @RequirePermissions('errors:read')
  @ApiOperation({ summary: 'Get an error with stack trace' })
  findError(@Param('id') id: string) {
    return this.monitoringService.findError(id);
  }

  @Patch('errors/:id/resolve')
  @RequirePermissions('errors:resolve')
  @ApiOperation({ summary: 'Mark an error resolved' })
  resolveError(
    @Param('id') id: string,
    @Body() body: { resolution?: string },
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.monitoringService.resolveError(id, body?.resolution, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Patch('errors/:id/dismiss')
  @RequirePermissions('errors:resolve')
  @ApiOperation({ summary: 'Dismiss an error' })
  dismissError(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.monitoringService.dismissError(id, { id: actor.id, email: actor.email });
  }

  @Get('health/history/:service')
  @RequirePermissions('health:read')
  @ApiOperation({ summary: 'List health check history for a service' })
  listHealthHistory(@Param('service') service: string) {
    return this.monitoringService.listHealthHistory(service);
  }
}
