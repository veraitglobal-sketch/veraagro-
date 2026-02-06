import { Module } from '@nestjs/common';
import { ImageResizeService } from './image-resize.service';

@Module({
  providers: [ImageResizeService],
  exports: [ImageResizeService],
})
export class ImageResizeModule {}
