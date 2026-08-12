import { BadRequestException } from '@nestjs/common';
import { isValidUuid } from './string.util';

export function assertUuid(value: string, field = 'id'): void {
  if (!isValidUuid(value)) {
    throw new BadRequestException(`${field} must be a valid UUID`);
  }
}

export function parseBoolean(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true' || value === '1';
}
