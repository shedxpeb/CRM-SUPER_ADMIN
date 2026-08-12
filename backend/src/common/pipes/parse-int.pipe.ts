import { Injectable, ParseIntPipe } from '@nestjs/common';

@Injectable()
export class ParseIntPipeSafe extends ParseIntPipe {
  constructor() {
    super({ optional: true });
  }
}
