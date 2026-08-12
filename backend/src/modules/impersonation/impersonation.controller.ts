import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ImpersonationService } from './impersonation.service';
import {
  ImpersonateDto,
  ListImpersonationLogsDto,
  EndImpersonationDto,
} from './dto/impersonation.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { AllowAuthenticated } from '../../common/decorators/allow-authenticated.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('impersonation')
@Controller()
export class ImpersonationController {
  constructor(private readonly impersonationService: ImpersonationService) {}

  @Post('tenants/:id/impersonate')
  @RequirePermissions('organization:impersonate')
  @ApiOperation({ summary: 'Start impersonating a tenant' })
  impersonate(
    @Param('id') id: string,
    @Body() dto: ImpersonateDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.impersonationService.impersonate(id, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Post('impersonation/exit')
  @RequirePermissions('organization:impersonate')
  @ApiOperation({ summary: 'End active impersonation session(s) for the caller' })
  exit(@Body() dto: EndImpersonationDto, @CurrentUser() actor: CurrentUser) {
    return this.impersonationService.exit({ id: actor.id, email: actor.email }, dto);
  }

  @Get('impersonation/active')
  @AllowAuthenticated()
  @ApiOperation({ summary: 'Get the active impersonation session for the caller' })
  active(@CurrentUser('id') userId: string) {
    return this.impersonationService.findActiveForUser(userId);
  }

  @Get('impersonation')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'List impersonation logs' })
  findAll(@Req() req: FastifyRequest & { query: ListImpersonationLogsDto }) {
    return this.impersonationService.findAll(req.query);
  }

  @Get('impersonation/:id')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'Get an impersonation log' })
  findOne(@Param('id') id: string) {
    return this.impersonationService.findOne(id);
  }
}
