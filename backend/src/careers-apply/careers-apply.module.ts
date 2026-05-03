import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { CareersApplyController } from './careers-apply.controller';
import { CareersApplyService } from './careers-apply.service';

@Module({
  imports: [EmailModule],
  controllers: [CareersApplyController],
  providers: [CareersApplyService],
})
export class CareersApplyModule {}
