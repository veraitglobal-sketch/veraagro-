import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUMES: ReadonlyArray<{
  mime: string;
  checkMagic: (b: Buffer) => boolean;
}> = [
  {
    mime: 'application/pdf',
    checkMagic: (b) => b.length >= 5 && b.subarray(0, 5).toString('utf8') === '%PDF-',
  },
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    checkMagic: (b) =>
      b.length >= 4 && b.readUInt32LE(0) === 0x04034b50, // ZIP local file header PK\x03\x04
  },
  {
    mime: 'application/msword',
    checkMagic: (b) =>
      b.length >= 8 && b.subarray(0, 8).toString('hex').toLowerCase() === 'd0cf11e0a1b11ae1',
  },
];

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(private readonly emailService: EmailService) {}

  private sanitizeResumeFilename(raw: string): string | null {
    const stripped = raw.replace(/^.*[/\\]/, '').trim().slice(0, 180);
    if (!stripped || stripped.includes('..')) return null;
    const lower = stripped.toLowerCase();
    const hasOkExt =
      lower.endsWith('.pdf') || lower.endsWith('.doc') || lower.endsWith('.docx');
    if (!hasOkExt) return null;
    return stripped;
  }

  /**
   * Returns resume buffer + filename or an error message.
   */
  private parseCareersResume(
    base64: string | undefined,
    fileNameRaw: string | undefined,
    mimeRaw: string | undefined,
  ): { error: string } | { filename: string; buffer: Buffer; contentType: string } {
    if (!base64 || !fileNameRaw) {
      return { error: 'Resume (CV) is required for job applications.' };
    }
    let buffer: Buffer;
    try {
      buffer = Buffer.from(base64.replace(/\s+/g, ''), 'base64');
    } catch {
      return { error: 'Invalid resume file encoding.' };
    }
    if (buffer.length < 64) return { error: 'Resume file is empty or corrupted.' };
    if (buffer.length > RESUME_MAX_BYTES) return { error: 'Resume exceeds maximum size (5 MB).' };

    const filename = this.sanitizeResumeFilename(fileNameRaw);
    if (!filename) {
      return { error: 'Use a PDF or Word file (.pdf, .doc, .docx).' };
    }

    const mimeFromClient = mimeRaw?.toLowerCase().trim();
    let rule = ALLOWED_RESUMES.find((r) => r.mime === mimeFromClient);

    const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
    if (!rule) {
      if (ext === '.pdf') rule = ALLOWED_RESUMES[0];
      else if (ext === '.docx') rule = ALLOWED_RESUMES[1];
      else if (ext === '.doc') rule = ALLOWED_RESUMES[2];
    }
    if (!rule) return { error: 'Invalid file type. Use PDF or Word (.pdf, .doc, .docx).' };

    if (!rule.checkMagic(buffer)) return { error: 'File content does not match the selected format.' };

    return { filename, buffer, contentType: rule.mime };
  }

  /**
   * Submit contact form inquiry
   * Sends email notification and optionally stores in database
   */
  async submitContactInquiry(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
    careersApplication?: boolean;
    resumeBase64?: string;
    resumeFileName?: string;
    resumeMimeType?: string;
  }): Promise<{ success: boolean; message: string }> {
    let resumeAttachment:
      | { filename: string; buffer: Buffer; contentType: string }
      | undefined;

    if (data.careersApplication) {
      const parsed = this.parseCareersResume(data.resumeBase64, data.resumeFileName, data.resumeMimeType);
      if ('error' in parsed) {
        return { success: false, message: parsed.error };
      }
      resumeAttachment = parsed;
    } else if (data.resumeBase64 || data.resumeFileName || data.resumeMimeType) {
      return { success: false, message: 'Unexpected attachment for this inquiry type.' };
    }

    try {
      const emailSent = await this.emailService.sendContactInquiryEmail({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        phone: data.phone,
        careersApplication: data.careersApplication,
        resumeAttachment,
      });

      if (!emailSent) {
        this.logger.warn(`Failed to send contact inquiry email for ${data.email}`);
        return {
          success: false,
          message: 'Failed to send your message. Please try again later.',
        };
      }

      this.logger.log(
        `${data.careersApplication ? 'Careers' : 'Contact'} inquiry submitted by ${data.email}`,
      );
      return {
        success: true,
        message: data.careersApplication
          ? 'Thank you for your application. We will get back to you soon.'
          : 'Thank you for your message. We will get back to you soon.',
      };
    } catch (error) {
      this.logger.error(`Error submitting contact inquiry:`, error);
      return {
        success: false,
        message: 'An error occurred. Please try again later.',
      };
    }
  }
}
