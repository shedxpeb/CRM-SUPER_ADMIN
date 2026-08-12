import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PermissionsService } from './permissions.service';
import { ListPermissionsDto } from './dto/list-permissions.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('rbac:read')
  @ApiOperation({ summary: 'List permission catalog' })
  findAll(@Req() req: FastifyRequest & { query: ListPermissionsDto }) {
    return this.permissionsService.findAll(req.query);
  }

  @Get(':id')
  @RequirePermissions('rbac:read')
  @ApiOperation({ summary: 'Get a permission and its assigned roles' })
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }
}
