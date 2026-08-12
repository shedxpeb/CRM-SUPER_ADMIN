import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ObservabilityService } from './observability.service';
import { ListApiLogsDto, ListSlowQueriesDto, ListSystemLogsDto } from './dto/observability.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('monitoring')
@Controller('monitoring')
export class ObservabilityController {
  constructor(private readonly observabilityService: ObservabilityService) {}

  @Get('api-logs')
  @RequirePermissions('logs:read')
  @ApiOperation({ summary: 'List API request logs' })
  listApiLogs(@Req() req: FastifyRequest & { query: ListApiLogsDto }) {
    return this.observabilityService.listApiLogs(req.query);
  }

  @Get('slow-queries')
  @RequirePermissions('logs:read')
  @ApiOperation({ summary: 'List slow query logs' })
  listSlowQueries(@Req() req: FastifyRequest & { query: ListSlowQueriesDto }) {
    return this.observabilityService.listSlowQueries(req.query);
  }

  @Get('trace/:correlationId')
  @RequirePermissions('logs:read')
  @ApiOperation({ summary: 'Trace a request by correlation id across API/audit logs' })
  trace(@Param('correlationId') correlationId: string) {
    return this.observabilityService.traceCorrelation(correlationId);
  }

  @Get('system-logs')
  @RequirePermissions('logs:read')
  @ApiOperation({ summary: 'List system logs' })
  listSystemLogs(@Req() req: FastifyRequest & { query: ListSystemLogsDto }) {
    return this.observabilityService.listSystemLogs(req.query);
  }
}
