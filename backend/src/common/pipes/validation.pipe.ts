import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ErrorCodes } from '../constants/error-codes.constants';

export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const details = errors.map((error) => ({
          field: error.property,
          messages: Object.values(error.constraints || {}),
        }));
        return new BadRequestException({
          code: ErrorCodes.VALIDATION_FAILED,
          message: 'Validation failed',
          details,
        });
      },
    });
  }
}
