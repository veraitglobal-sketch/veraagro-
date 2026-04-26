import { Module } from '@nestjs/common';
import { B2bSuppliersService } from './b2b-suppliers.service';
import { B2bSuppliersController } from './b2b-suppliers.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ImageResizeModule } from '../common/image/image-resize.module';
import { ImageUploadInterceptor } from '../field-entries/image-upload.interceptor';

@Module({
  imports: [PrismaModule, ImageResizeModule],
  controllers: [B2bSuppliersController],
  providers: [B2bSuppliersService, ImageUploadInterceptor],
  exports: [B2bSuppliersService],
})
export class B2bSuppliersModule {}
