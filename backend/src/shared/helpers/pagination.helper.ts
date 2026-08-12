import { PaginationDto } from '../../common/dto/pagination.dto';
import { PaginationDefaults } from '../../common/constants/pagination.constants';

export function resolvePage(dto: PaginationDto): { page: number; skip: number; take: number } {
  const page = dto.page || PaginationDefaults.page;
  const pageSize = Math.min(
    dto.pageSize || PaginationDefaults.pageSize,
    PaginationDefaults.maxPageSize,
  );
  return { page, skip: (page - 1) * pageSize, take: pageSize };
}

export function buildPageMeta(
  page: number,
  pageSize: number,
  total: number,
  sort?: string,
  filters?: Record<string, unknown>,
) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    sort,
    filters,
  };
}
