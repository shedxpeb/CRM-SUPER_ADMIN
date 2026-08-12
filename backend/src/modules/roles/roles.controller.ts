import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import { ListRolesDto } from './dto/list-roles.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('roles')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('rbac:read')
  @ApiOperation({ summary: 'List platform roles' })
  findAll(@Req() req: FastifyRequest & { query: ListRolesDto }) {
    return this.rolesService.findAll(req.query);
  }

  @Get(':id')
  @RequirePermissions('rbac:read')
  @ApiOperation({ summary: 'Get a role with its permissions' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @RequirePermissions('rbac:manage')
  @ApiOperation({ summary: 'Create a role' })
  create(@Body() dto: CreateRoleDto, @CurrentUser() actor: CurrentUser) {
    return this.rolesService.create(dto, { id: actor.id, email: actor.email });
  }

  @Patch(':id')
  @RequirePermissions('rbac:manage')
  @ApiOperation({ summary: 'Update a role' })
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto, @CurrentUser() actor: CurrentUser) {
    return this.rolesService.update(id, dto, { id: actor.id, email: actor.email });
  }

  @Delete(':id')
  @RequirePermissions('rbac:manage')
  @ApiOperation({ summary: 'Soft-delete a role' })
  remove(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.rolesService.remove(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/permissions')
  @RequirePermissions('rbac:manage')
  @ApiOperation({ summary: 'Replace a role permission set' })
  assignPermissions(
    @Param('id') id: string,
    @Body() dto: AssignPermissionsDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.rolesService.assignPermissions(id, dto, { id: actor.id, email: actor.email });
  }

  @Get(':id/users')
  @RequirePermissions('rbac:read')
  @ApiOperation({ summary: 'List users assigned a role' })
  getRoleUsers(@Param('id') id: string) {
    return this.rolesService.getRoleUsers(id);
  }
}
