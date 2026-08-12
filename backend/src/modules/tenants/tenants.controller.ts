import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { ListTenantsDto } from './dto/list-tenants.dto';
import { SuspendTenantDto } from './dto/tenant-actions.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'List tenants' })
  findAll(@Req() req: FastifyRequest & { query: ListTenantsDto }) {
    return this.tenantsService.findAll(req.query);
  }

  @Get(':id')
  @RequirePermissions('organization:read')
  @ApiOperation({ summary: 'Get a tenant by id' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @RequirePermissions('organization:create')
  @ApiOperation({ summary: 'Create a tenant' })
  create(@Body() dto: CreateTenantDto, @CurrentUser() actor: CurrentUser) {
    return this.tenantsService.create(dto, { id: actor.id, email: actor.email });
  }

  @Patch(':id')
  @RequirePermissions('organization:update')
  @ApiOperation({ summary: 'Update a tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto, @CurrentUser() actor: CurrentUser) {
    return this.tenantsService.update(id, dto, { id: actor.id, email: actor.email });
  }

  @Delete(':id')
  @RequirePermissions('organization:delete')
  @ApiOperation({ summary: 'Soft-delete a tenant' })
  remove(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.tenantsService.remove(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/restore')
  @RequirePermissions('organization:restore')
  @ApiOperation({ summary: 'Restore a soft-deleted tenant' })
  restore(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.tenantsService.restore(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/suspend')
  @RequirePermissions('organization:suspend')
  @ApiOperation({ summary: 'Suspend a tenant' })
  suspend(
    @Param('id') id: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantsService.suspend(id, dto, { id: actor.id, email: actor.email });
  }

  @Post(':id/unsuspend')
  @RequirePermissions('organization:suspend')
  @ApiOperation({ summary: 'Activate a suspended tenant' })
  unsuspend(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.tenantsService.unsuspend(id, { id: actor.id, email: actor.email });
  }
}
