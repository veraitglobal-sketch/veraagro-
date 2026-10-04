import {
  Body,
  BadRequestException,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PassportDocumentVerificationStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { PassportDocumentsService } from './passport-documents.service';

@Controller()
export class PassportDocumentsController {
  constructor(private readonly service: PassportDocumentsService) {}

  @Get('passport-documents/grower')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER', 'ADMIN', 'SUPER_ADMIN')
  listGrower(
    @Request() req: { user: { id: string } },
    @Query('batchId') batchId?: string,
    @Query('catalogProductId') catalogProductId?: string,
  ) {
    return this.service.listForGrower(req.user.id, batchId, catalogProductId);
  }

  @Post('passport-documents/grower')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('GROWER', 'FARMER', 'PARTNER')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  uploadGrower(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
    @Body()
    body: {
      title: string;
      docType: 'CERTIFICATE' | 'LAB_RESULT' | 'OTHER';
      scope: 'PRODUCT' | 'LOT' | 'PLANTING' | 'ESTATE';
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
      isPublic?: string;
      estateId: string;
      catalogProductId?: string;
      batchId?: string;
      plantingId?: string;
    },
  ) {
    if (!file) throw new BadRequestException('Document file is required');
    return this.service.createForGrower(req.user.id, {
      ...body,
      isPublic: body.isPublic === 'true' || body.isPublic === '1',
      file: {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
    });
  }

  @Get('admin/passport-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  listAdmin(@Query('status') status?: PassportDocumentVerificationStatus) {
    return this.service.listAdmin(status);
  }

  @Patch('admin/passport-documents/:id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  adminVerify(
    @Param('id') id: string,
    @Body() body: { status: PassportDocumentVerificationStatus; isPublic?: boolean },
  ) {
    return this.service.adminVerify(id, body.status, body.isPublic);
  }
}
