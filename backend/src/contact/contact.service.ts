import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContactService {
  private readonly logger = new Logger(ContactService.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

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
  }): Promise<{ success: boolean; message: string }> {
    try {
      // Send email notification
      const emailSent = await this.emailService.sendContactInquiryEmail({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        phone: data.phone,
      });

      if (!emailSent) {
        this.logger.warn(`Failed to send contact inquiry email for ${data.email}`);
        return {
          success: false,
          message: 'Failed to send your message. Please try again later.',
        };
      }

      // Optionally store in database for admin review
      // You can uncomment this if you want to store inquiries in the database
      /*
      await this.prisma.contact_inquiries.create({
        data: {
          id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          phone: data.phone || null,
          status: 'PENDING',
          createdAt: new Date(),
        },
      });
      */

      this.logger.log(`Contact inquiry submitted by ${data.email}`);
      return {
        success: true,
        message: 'Thank you for your message. We will get back to you soon.',
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
