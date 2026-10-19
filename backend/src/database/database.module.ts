import { Global, Module } from '@nestjs/common';
import { SqlService } from './sql.service';

@Global()
@Module({
  providers: [SqlService],
  exports: [SqlService],
})
export class DatabaseModule {}
