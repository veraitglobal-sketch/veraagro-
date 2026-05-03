import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { parseResumeFromBase64 } from '../common/resume-attachment.util';

@Injectable()
export class CareersApplyService {
  private readonly logger = new Logger(CareersApplyService.name);

  constructor(private readonly emailService: EmailService) {}

  async submit(data: {
    name: string;
    email: string;
    phone?: string;
    roleKey?: string;
    appliedRoleTitle: string;
    coverLetter: string;
    linkedinUrl?: string;
    resumeBase64: string;
    resumeFileName: string;
    resumeMimeType?: string;
  }): Promise<{ success: boolean; message: string }> {
    const parsed = parseResumeFromBase64(
      data.resumeBase64,
      data.resumeFileName,
      data.resumeMimeType,
    );
    if ('error' in parsed) {
      return { success: false, message: parsed.error };
    }

    try {
      const ok = await this.emailService.sendCareersApplicationEmail({
        name: data.name,
        email: data.email,
        phone: data.phone,
        roleKey: data.roleKey,
        appliedRoleTitle: data.appliedRoleTitle,
        coverLetter: data.coverLetter,
        linkedinUrl: data.linkedinUrl,
        resumeAttachment: parsed,
      });
      if (!ok) {
        return {
          success: false,
          message: 'Failed to send your application. Please try again later.',
        };
      }
      this.logger.log(`Careers application submitted: ${data.email} (${data.roleKey ?? data.appliedRoleTitle})`);
      return {
        success: true,
        message: 'Thank you for your application. We will get back to you soon.',
      };
    } catch (error) {
      this.logger.error('Careers apply error:', error);
      return { success: false, message: 'An error occurred. Please try again later.' };
    }
  }
}
