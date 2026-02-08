import { Module } from '@nestjs/common';
import { FarmerProfileController } from './farmer-profile.controller';
import { FarmerProfileService } from './farmer-profile.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageResizeModule } from '../common/image/image-resize.module';
import { FieldEntriesModule } from '../field-entries/field-entries.module';
import { ImageUploadInterceptor } from '../field-entries/image-upload.interceptor';

@Module({
  imports: [PrismaModule, ImageResizeModule, FieldEntriesModule],
  controllers: [FarmerProfileController],
  providers: [FarmerProfileService, ImageUploadInterceptor],
  exports: [FarmerProfileService],
})
export class FarmerProfileModule {}
