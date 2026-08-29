import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { TenantOpsService } from './tenant-ops.service';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  AssignTenantUserRoleDto,
  CreateTenantRoleDto,
  CreateTenantUserDto,
  ResetTenantUserPasswordDto,
  SetTenantRolePermissionsDto,
  SetTenantUserActiveDto,
  SetTenantUserModulesDto,
  SetTenantUserPermissionsDto,
  UpdateTenantRoleDto,
  UpdateTenantUserDto,
} from './dto/tenant-crm.dto';

@ApiTags('tenants')
@Controller('tenants/:id')
export class TenantOpsController {
  constructor(private readonly tenantOpsService: TenantOpsService) {}

  // ── Activity / Modules ──────────────────────────────────────────────────────

  @Get('activity')
  @RequirePermissions('audit:read')
  @ApiOperation({ summary: 'Get the activity timeline (audit log) for a tenant' })
  getActivity(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.tenantOpsService.getActivity(id, query);
  }

  @Get('modules')
  @RequirePermissions('tenants:read')
  @ApiOperation({ summary: 'Get module enable/disable status for a tenant' })
  getModules(@Param('id') id: string) {
    return this.tenantOpsService.getModules(id);
  }

  @Put('modules')
  @RequirePermissions('tenants:manage')
  @ApiOperation({ summary: 'Update module enable/disable status for a tenant (propagates to CRM)' })
  updateModules(
    @Param('id') id: string,
    @Body() modules: Record<string, boolean>,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.tenantOpsService.updateModules(id, modules, user.id);
  }

  // ── Users (CRM) ─────────────────────────────────────────────────────────────

  @Get('users')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List CRM users for a tenant' })
  getUsers(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.tenantOpsService.getTenantUsers(id, query);
  }

  @Get('users/:userId')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get a CRM user for a tenant' })
  getUser(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantOpsService.getTenantUser(id, userId);
  }

  @Post('users')
  @RequirePermissions('users:create')
  @ApiOperation({ summary: 'Create a CRM user for a tenant' })
  createUser(
    @Param('id') id: string,
    @Body() dto: CreateTenantUserDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.createTenantUser(id, dto, { id: actor.id, email: actor.email });
  }

  @Patch('users/:userId')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update a CRM user for a tenant' })
  updateUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateTenantUserDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.updateTenantUser(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Patch('users/:userId/active')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Enable / disable a CRM user for a tenant' })
  setUserActive(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SetTenantUserActiveDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.setTenantUserActive(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Post('users/:userId/reset-password')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Reset a CRM user password for a tenant' })
  resetPassword(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: ResetTenantUserPasswordDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.resetTenantUserPassword(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Post('users/:userId/force-logout')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Force logout a CRM user (revoke sessions/tokens)' })
  forceLogout(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.forceLogoutTenantUser(id, userId, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Delete('users/:userId')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Soft-delete a CRM user for a tenant' })
  deleteUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.softDeleteTenantUser(id, userId, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Get('users/:userId/roles')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get the roles assigned to a CRM user' })
  getUserRoles(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantOpsService.getTenantUserRoles(id, userId);
  }

  @Post('users/:userId/roles')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Assign a role to a CRM user' })
  assignRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: AssignTenantUserRoleDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.assignTenantUserRole(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Delete('users/:userId/roles')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Remove role assignments from a CRM user' })
  removeRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.removeTenantUserRole(id, userId, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Get('users/:userId/effective-permissions')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get effective permissions for a CRM user (role + overrides + module restrictions)' })
  getEffectivePermissions(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantOpsService.getEffectivePermissionsForUser(id, userId);
  }

  @Get('users/:userId/permissions')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: "Get a CRM user's direct permission overrides (grant/deny)" })
  getUserPermissions(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantOpsService.getTenantUserPermissions(id, userId);
  }

  @Put('users/:userId/permissions')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: "Set a CRM user's direct permission overrides (granted/denied list)" })
  setUserPermissions(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SetTenantUserPermissionsDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.setTenantUserPermissions(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Get('users/:userId/modules')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: "Get a CRM user's module access overrides" })
  getUserModules(@Param('id') id: string, @Param('userId') userId: string) {
    return this.tenantOpsService.getTenantUserModules(id, userId);
  }

  @Put('users/:userId/modules')
  @RequirePermissions('users:update')
  @ApiOperation({ summary: "Set a CRM user's module access overrides (allowed/denied list)" })
  setUserModules(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: SetTenantUserModulesDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.setTenantUserModules(id, userId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  // ── Roles (CRM) ─────────────────────────────────────────────────────────────

  @Get('roles')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List CRM roles for a tenant' })
  getRoles(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.tenantOpsService.getTenantRoles(id, query);
  }

  @Get('roles/assignable')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List roles available to assign to users' })
  getAssignableRoles(@Param('id') id: string) {
    return this.tenantOpsService.listAssignableRoles(id);
  }

  @Get('roles/:roleId')
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get a CRM role for a tenant' })
  getRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.tenantOpsService.getTenantRole(id, roleId);
  }

  @Post('roles')
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Create a CRM role for a tenant' })
  createRole(
    @Param('id') id: string,
    @Body() dto: CreateTenantRoleDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.createTenantRole(id, dto, { id: actor.id, email: actor.email });
  }

  @Patch('roles/:roleId')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Update a CRM role for a tenant' })
  updateRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() dto: UpdateTenantRoleDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.updateTenantRole(id, roleId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Post('roles/:roleId/clone')
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Clone a CRM role for a tenant' })
  cloneRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.cloneTenantRole(id, roleId, { id: actor.id, email: actor.email });
  }

  @Delete('roles/:roleId')
  @RequirePermissions('roles:delete')
  @ApiOperation({ summary: 'Soft delete a CRM role for a tenant' })
  deleteRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.deleteTenantRole(id, roleId, { id: actor.id, email: actor.email });
  }

  @Put('roles/:roleId/permissions')
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Assign permissions to a CRM role' })
  setRolePermissions(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() dto: SetTenantRolePermissionsDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.setTenantRolePermissions(id, roleId, dto, {
      id: actor.id,
      email: actor.email,
    });
  }

  // ── Permissions / Login history / Sessions ──────────────────────────────────

  @Get('permissions')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get the permission matrix for a tenant (CRM source)' })
  getPermissions(@Param('id') id: string) {
    return this.tenantOpsService.getTenantPermissions(id);
  }

  @Get('permissions/catalog')
  @RequirePermissions('permissions:read')
  @ApiOperation({ summary: 'Get the full CRM permission catalog grouped by module' })
  getPermissionCatalog() {
    return this.tenantOpsService.getPermissionCatalog();
  }

  @Get('login-history')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'Get login history for a tenant (CRM source)' })
  getLoginHistory(@Param('id') id: string, @Query() query: PaginationDto) {
    return this.tenantOpsService.getTenantLoginHistory(id, query);
  }

  @Get('sessions')
  @RequirePermissions('security:read')
  @ApiOperation({ summary: 'Get sessions for a tenant (CRM source)' })
  getSessions(
    @Param('id') id: string,
    @Req() req: FastifyRequest & { query: PaginationDto & { active?: string } },
  ) {
    const query = req.query;
    const active = query.active === undefined ? undefined : query.active === 'true';
    return this.tenantOpsService.getTenantSessions(id, { ...query, active });
  }

  @Post('sessions/:sessionId/revoke')
  @RequirePermissions('security:manage')
  @ApiOperation({ summary: 'Revoke a CRM session for a tenant' })
  revokeSession(
    @Param('id') id: string,
    @Param('sessionId') sessionId: string,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.tenantOpsService.revokeTenantSession(id, sessionId, {
      id: actor.id,
      email: actor.email,
    });
  }
}
