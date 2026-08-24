import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../auth/services/audit.service';
import { UpdatePlatformSettingDto } from './dto/update-platform-setting.dto';
import { ListPlatformSettingsDto } from './dto/list-platform-settings.dto';
import { resolvePage, buildPageMeta } from '../../shared/helpers/pagination.helper';

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(dto: ListPlatformSettingsDto) {
    const { page, skip, take } = resolvePage(dto);

    const where: Record<string, unknown> = {};
    if (dto.category) where.category = dto.category;

    const [items, total] = await Promise.all([
      this.prisma.platformSetting.findMany({ where, skip, take, orderBy: { key: 'asc' } }),
      this.prisma.platformSetting.count({ where }),
    ]);

    return {
      items,
      meta: buildPageMeta(page, take, total, undefined),
    };
  }

  async update(key: string, dto: UpdatePlatformSettingDto, actor: { id: string; email: string }) {
    const setting = await this.prisma.platformSetting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Platform setting not found');

    const updated = await this.prisma.platformSetting.update({
      where: { key },
      data: {
        value: dto.value as any,
        description: dto.description,
        updatedById: actor.id,
      },
    });

    await this.auditService.record({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'platform.setting.update',
      targetType: 'PlatformSetting',
      targetId: updated.id,
      targetName: updated.key,
      metadata: { oldValue: setting.value, newValue: dto.value },
    });

    return updated;
  }
}
