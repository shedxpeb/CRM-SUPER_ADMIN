import { PaginationDto } from '../../common/dto/pagination.dto';

const ALLOWED_DIRECTIONS = ['asc', 'desc'];

/**
 * Parses a `sort` query string like "createdAt:desc,name:asc" into a Prisma
 * orderBy array, ignoring unknown fields/directions to stay injection-safe.
 */
export function parseSort<T extends string>(
  dto: PaginationDto,
  allowedFields: T[],
  defaultField: T,
  defaultDirection: 'asc' | 'desc' = 'desc',
): Record<string, 'asc' | 'desc'>[] {
  const result: Record<string, 'asc' | 'desc'>[] = [];
  if (dto.sort) {
    const parts = dto.sort.split(',');
    for (const part of parts) {
      const [field, direction] = part.split(':');
      if (field && allowedFields.includes(field as T)) {
        result.push({
          [field]: ALLOWED_DIRECTIONS.includes(direction) ? (direction as 'asc' | 'desc') : 'asc',
        });
      }
    }
  }
  if (result.length === 0) {
    result.push({ [defaultField]: defaultDirection });
  }
  return result;
}
