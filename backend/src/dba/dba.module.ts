import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DbaController } from './dba.controller';
import { DbaService } from './dba.service';

@Module({
  imports: [AuthModule],
  controllers: [DbaController],
  providers: [DbaService],
  exports: [DbaService],
})
export class DbaModule {}
