import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ImageResizeService } from '../common/image/image-resize.service';

/**
 * Image Upload Interceptor
 * PERFORMANCE: Automatically resize images on upload
 * 
 * Resizes images to max 1920px width before saving
 */
@Injectable()
export class ImageUploadInterceptor implements NestInterceptor {
  private readonly logger = new Logger(ImageUploadInterceptor.name);

  constructor(private imageResizeService: ImageResizeService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const files = request.files || (request.file ? [request.file] : []);

    // Resize all uploaded images
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.buffer && this.isImageFile(file.mimetype)) {
          try {
            this.logger.debug(`Resizing image: ${file.originalname}`);
            const resized = await this.imageResizeService.resizeImage(file.buffer);
            file.buffer = resized;
            file.size = resized.length;
          } catch (error) {
            this.logger.error(`Error resizing image ${file.originalname}:`, error);
            // Continue with original file if resize fails
          }
        }
      }
    }

    return next.handle();
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimetype: string): boolean {
    return mimetype?.startsWith('image/') || false;
  }
}
