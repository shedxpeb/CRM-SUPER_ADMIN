import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { AdminResetPasswordDto, SuspendUserDto } from './dto/admin-user-actions.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List platform users' })
  findAll(@Req() req: FastifyRequest & { query: ListUsersDto }) {
    return this.usersService.findAll(req.query);
  }

  @Get(':id')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get a platform user by id' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Create a platform user' })
  create(@Body() dto: CreateUserDto, @CurrentUser() actor: CurrentUser) {
    return this.usersService.create(dto, { id: actor.id, email: actor.email });
  }

  @Patch(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Update a platform user' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() actor: CurrentUser) {
    return this.usersService.update(id, dto, { id: actor.id, email: actor.email });
  }

  @Delete(':id')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Soft-delete a platform user' })
  remove(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.usersService.remove(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/restore')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Restore a soft-deleted platform user' })
  restore(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.usersService.restore(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/suspend')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Suspend a platform user' })
  suspend(@Param('id') id: string, @Body() dto: SuspendUserDto, @CurrentUser() actor: CurrentUser) {
    return this.usersService.suspend(id, { id: actor.id, email: actor.email }, dto.reason);
  }

  @Post(':id/unsuspend')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Unsuspend a platform user' })
  unsuspend(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.usersService.unsuspend(id, { id: actor.id, email: actor.email });
  }

  @Post(':id/reset-password')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Reset a platform user password' })
  resetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.usersService.resetPassword(id, dto.newPassword, {
      id: actor.id,
      email: actor.email,
    });
  }

  @Post(':id/force-logout')
  @RequirePermissions('users:manage')
  @ApiOperation({ summary: 'Terminate all sessions for a user' })
  forceLogout(@Param('id') id: string, @CurrentUser() actor: CurrentUser) {
    return this.usersService.forceLogout(id, { id: actor.id, email: actor.email });
  }

  @Get(':id/sessions')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List a user active sessions' })
  getSessions(@Param('id') id: string) {
    return this.usersService.getSessions(id);
  }

  @Get(':id/login-history')
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List a user login history' })
  getLoginHistory(@Param('id') id: string) {
    return this.usersService.getLoginHistory(id);
  }
}
