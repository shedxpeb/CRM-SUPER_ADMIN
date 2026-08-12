import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BaseService {
  constructor(protected readonly prisma: PrismaService) {}
}
