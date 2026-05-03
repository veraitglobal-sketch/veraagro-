import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CareersApplyDto } from './dto/careers-apply.dto';
import { CareersApplyService } from './careers-apply.service';

@Controller('careers')
export class CareersApplyController {
  constructor(private readonly careersApplyService: CareersApplyService) {}

  /**
   * Public job application (CV + structured answers). Same ADMIN_EMAIL inbox as contact.
   */
  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 900000 } })
  submit(@Body() dto: CareersApplyDto) {
    if (!dto.name?.trim() || !dto.email || !dto.appliedRoleTitle?.trim() || !dto.coverLetter?.trim()) {
      return {
        success: false,
        message: 'Please fill all required fields.',
      };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      return {
        success: false,
        message: 'Please provide a valid email address.',
      };
    }
    return this.careersApplyService.submit({
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim(),
      roleKey: dto.roleKey?.trim(),
      appliedRoleTitle: dto.appliedRoleTitle.trim(),
      coverLetter: dto.coverLetter.trim(),
      linkedinUrl: dto.linkedinUrl?.trim(),
      resumeBase64: dto.resumeBase64,
      resumeFileName: dto.resumeFileName.trim(),
      resumeMimeType: dto.resumeMimeType,
    });
  }
}
