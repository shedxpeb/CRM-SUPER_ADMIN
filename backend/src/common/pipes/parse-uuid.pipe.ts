import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';
import { isValidUuid } from '../utils/string.util';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isValidUuid(value)) {
      throw new BadRequestException('Invalid UUID format');
    }
    return value;
  }
}
