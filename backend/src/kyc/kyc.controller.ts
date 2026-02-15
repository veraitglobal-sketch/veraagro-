import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KycService } from './kyc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('kyc')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('documents')
  @UseGuards(JwtAuthGuard)
  async uploadDocument(
    @GetUser() user: any,
    @Body() body: { docType: string; fileUrl: string },
  ) {
    if (!body.docType || !body.fileUrl) {
      throw new BadRequestException('docType and fileUrl are required');
    }
    return this.kycService.uploadDocument(user.id, body.docType, body.fileUrl);
  }

  @Get('documents')
  @UseGuards(JwtAuthGuard)
  async getMyDocuments(@GetUser() user: any) {
    return this.kycService.getMyDocuments(user.id);
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getKycStatus(@GetUser() user: any) {
    return this.kycService.getKycStatus(user.id);
  }

  @Get('documents/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async getDocumentsByUser(@GetUser() user: any, @Param('userId') userId: string) {
    return this.kycService.getDocumentsByUser(userId, user.id);
  }

  @Post('documents/:documentId/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'COORDINATOR')
  async verifyDocument(
    @GetUser() user: any,
    @Param('documentId') documentId: string,
    @Body() body: { approved: boolean; reason?: string },
  ) {
    return this.kycService.verifyDocument(documentId, user.id, body.approved, body.reason);
  }
}
