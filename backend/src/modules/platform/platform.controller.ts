import { Body, Controller, Get, Param, Patch, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { PlatformService } from './platform.service';
import { ListPlatformSettingsDto } from './dto/list-platform-settings.dto';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MODULE_CATALOG } from '../../common/constants/module-catalog.constants';

@ApiTags('platform')
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('modules')
  @RequirePermissions('platform:read')
  @ApiOperation({ summary: 'Get the platform module catalog (keys, labels, categories)' })
  moduleCatalog() {
    return MODULE_CATALOG;
  }

  @Get('settings')
  @RequirePermissions('platform:read')
  @ApiOperation({ summary: 'List platform settings' })
  findAll(@Req() req: FastifyRequest & { query: ListPlatformSettingsDto }) {
    return this.platformService.findAll(req.query);
  }

  @Patch('settings/:key')
  @RequirePermissions('platform:manage')
  @ApiOperation({ summary: 'Update a platform setting' })
  update(
    @Param('key') key: string,
    @Body() dto: UpdatePlatformSettingDto,
    @CurrentUser() actor: CurrentUser,
  ) {
    return this.platformService.update(key, dto, { id: actor.id, email: actor.email });
  }
}
