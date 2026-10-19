import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BiController } from './bi.controller';
import { BiService } from './bi.service';

@Module({
  imports: [AuthModule],
  controllers: [BiController],
  providers: [BiService],
  exports: [BiService],
})
export class BiModule {}
