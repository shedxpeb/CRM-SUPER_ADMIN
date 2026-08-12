import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationResponse } from '../../common/interfaces/pagination-response.interface';
import { PaginationDefaults } from '../../common/constants/pagination.constants';

export interface WhereBuilder<W> {
  (dto: PaginationDto, base?: W): W;
}

@Injectable()
export class BaseRepository {
  constructor(protected readonly prisma: PrismaService) {}

  /** Standard soft-delete aware pagination for any Prisma delegate with a findMany/count. */
  protected async paginate<
    D extends { findMany: (a: never) => Promise<unknown>; count: (a: never) => Promise<number> },
  >(
    delegate: D,
    dto: PaginationDto,
    where: object,
    orderBy: object,
    select?: object,
  ): Promise<PaginationResponse<unknown>> {
    const page = dto.page || PaginationDefaults.page;
    const pageSize = Math.min(
      dto.pageSize || PaginationDefaults.pageSize,
      PaginationDefaults.maxPageSize,
    );

    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        ...(select ? { select } : {}),
      } as never),
      delegate.count({ where } as never),
    ]);

    return {
      items: items as unknown[],
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
        sort: JSON.stringify(orderBy),
      },
    };
  }
}
