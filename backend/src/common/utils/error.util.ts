import { ConflictException } from '@nestjs/common';
import { ErrorCodes } from '../constants/error-codes.constants';

/**
 * Throws a 409 when the optimistic-lock update affected zero rows.
 * Pass the version the caller expected so the error carries a retry hint.
 */
export function assertOptimisticLock(count: number, expectedVersion: number): void {
  if (count === 0) {
    throw new ConflictException({
      code: ErrorCodes.OPTIMISTIC_LOCK,
      message: 'Resource was modified by another request. Reload and retry.',
      expectedVersion,
    });
  }
}
