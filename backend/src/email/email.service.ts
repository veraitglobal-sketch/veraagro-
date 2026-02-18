import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private resend: Resend | null = null;

  constructor() {
    this.logger.log('EmailService v2 (Resend REST API support)');
    // Configure email transporter only when credentials exist (avoids "Missing credentials" in CI)
    // Supports: Resend (RESEND_API_KEY or SMTP_PASS), Gmail, Brevo, Mailgun, etc.
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
    this.logger.log(`RESEND_API_KEY: ${resendApiKey ? `set (${resendApiKey.length} chars)` : 'NOT SET'}`);

    // Resend REST API first - Railway blocks SMTP port 587
    if (resendApiKey && resendApiKey.startsWith('re_')) {
      this.resend = new Resend(resendApiKey);
      this.logger.log('Email configured: Resend REST API (contact form uses HTTPS, no SMTP)');
    } else if (resendApiKey) {
      this.logger.warn('RESEND_API_KEY set but invalid format (expected re_...), falling back to SMTP');
    }

    const useResend = smtpHost.includes('resend.com') || !!resendApiKey;
    const resendPass = resendApiKey || smtpPass;

    if (useResend && resendPass && !this.resend) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.resend.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: { user: 'resend', pass: resendPass },
      });
    } else if (smtpHost.includes('amazonses.com') && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else if (!this.resend) {
      this.logger.warn(
        'Email not configured: no RESEND_API_KEY/SMTP_PASS or SMTP user/pass. Emails will be skipped.',
      );
    }

    if (this.transporter && !this.resend) {
      this.logger.log(
        `Email configured: host=${process.env.SMTP_HOST || 'smtp.gmail.com'}`,
      );
      this.testConnection().catch(() => {});
    }
  }

  /**
   * Send welcome email to farmer with credentials
   */
  async sendFarmerWelcomeEmail(data: {
    email: string;
    firstName: string;
    lastName: string;
    partnerCode: string;
    password: string;
    farmerQrCode: string;
    farmerProfileUrl: string;
  }): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Bio Vera" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'info@biovera.app'}>`,
        to: data.email,
        subject: 'Welcome to Bio Vera - Your Access Credentials',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2D5A27; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .credentials { background-color: white; border: 2px solid #2D5A27; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .credential-item { margin: 10px 0; }
              .label { font-weight: bold; color: #2D5A27; }
              .value { font-family: monospace; font-size: 16px; color: #333; }
              .qr-info { background-color: #F0F9F0; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .button { display: inline-block; padding: 12px 24px; background-color: #2D5A27; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Bio Vera</h1>
                <p>Welcome to our network!</p>
              </div>
              
              <div class="content">
                <p>Dear <strong>${data.firstName} ${data.lastName}</strong>,</p>
                
                <p>Your account has been successfully created in the Bio Vera system. Here are your access credentials:</p>
                
                <div class="credentials">
                  <div class="credential-item">
                    <span class="label">Partner Code:</span>
                    <div class="value">${data.partnerCode}</div>
                  </div>
                  <div class="credential-item">
                    <span class="label">Email:</span>
                    <div class="value">${data.email}</div>
                  </div>
                  <div class="credential-item">
                    <span class="label">Password:</span>
                    <div class="value">${data.password}</div>
                  </div>
                </div>
                
                <p><strong>Important:</strong> Please change your password upon first login.</p>
                
                <div class="qr-info">
                  <h3>📱 Your QR Code</h3>
                  <p>Your unique QR code: <strong>${data.farmerQrCode}</strong></p>
                  <p>This QR code will be printed on your products. When customers scan the code, they will see your profile.</p>
                  <p><a href="${data.farmerProfileUrl}" class="button">View Your Profile</a></p>
                </div>
                
                <p>To log in, use your Partner Code or Email address together with your password.</p>
                
                <p>If you have any questions, please contact us at: <a href="mailto:info@biovera.app">info@biovera.app</a></p>
                
                <p>Best regards,<br>Bio Vera Team</p>
              </div>
              
              <div class="footer">
                <p>Bio Vera - Transparency from field to shelf</p>
                <p>This message was automatically generated. Please do not reply to this email.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Welcome to Bio Vera!

Dear ${data.firstName} ${data.lastName},

Your account has been successfully created. Here are your access credentials:

Partner Code: ${data.partnerCode}
Email: ${data.email}
Password: ${data.password}

IMPORTANT: Please change your password upon first login.

Your QR Code: ${data.farmerQrCode}
Profile: ${data.farmerProfileUrl}

To log in, use your Partner Code or Email address together with your password.

If you have any questions, please contact us at: info@biovera.app

Best regards,
Bio Vera Team
        `,
      };

      if (!this.transporter) {
        this.logger.warn('Email not configured, skipping welcome email');
        return false;
      }
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.email}:`, error);
      // Don't throw error - email failure shouldn't block user creation
      return false;
    }
  }

  /**
   * Send contact inquiry email notification
   */
  async sendContactInquiryEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): Promise<boolean> {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || process.env.SMTP_USER || 'info@biovera.app';
      // Resend free tier: use onboarding@resend.dev as FROM if no custom domain verified
      const fromAddr = process.env.EMAIL_FROM || process.env.SMTP_USER
        || (process.env.RESEND_API_KEY ? 'onboarding@resend.dev' : 'info@biovera.app');

      const mailOptions = {
        from: `"Bio Vera Contact Form" <${fromAddr}>`,
        to: adminEmail,
        replyTo: data.email,
        subject: `Contact Inquiry: ${data.subject}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2D5A27; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .info-box { background-color: white; border-left: 4px solid #2D5A27; padding: 15px; margin: 15px 0; }
              .label { font-weight: bold; color: #2D5A27; display: inline-block; min-width: 100px; }
              .message-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Bio Vera</h1>
                <p>New Contact Inquiry</p>
              </div>
              
              <div class="content">
                <p>You have received a new contact inquiry from the Bio Vera website:</p>
                
                <div class="info-box">
                  <div style="margin: 10px 0;">
                    <span class="label">Name:</span>
                    <span>${data.name}</span>
                  </div>
                  <div style="margin: 10px 0;">
                    <span class="label">Email:</span>
                    <span><a href="mailto:${data.email}">${data.email}</a></span>
                  </div>
                  ${data.phone ? `
                  <div style="margin: 10px 0;">
                    <span class="label">Phone:</span>
                    <span><a href="tel:${data.phone}">${data.phone}</a></span>
                  </div>
                  ` : ''}
                  <div style="margin: 10px 0;">
                    <span class="label">Subject:</span>
                    <span>${data.subject}</span>
                  </div>
                </div>
                
                <div class="message-box">
                  <h3 style="margin-top: 0; color: #2D5A27;">Message:</h3>
                  <p style="white-space: pre-wrap;">${data.message}</p>
                </div>
                
                <p style="margin-top: 30px;">
                  <strong>Reply to:</strong> <a href="mailto:${data.email}">${data.email}</a>
                </p>
              </div>
              
              <div class="footer">
                <p>Bio Vera - Contact Form Notification</p>
                <p>This email was automatically generated from the contact form on biovera.app</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
New Contact Inquiry from Bio Vera Website

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}Subject: ${data.subject}

Message:
${data.message}

---
Reply to: ${data.email}
        `,
      };

      if (this.resend) {
        // Use Resend REST API - no SMTP, works on Railway (port 587 often blocked)
        this.logger.log(
          `Sending contact inquiry via Resend API: to=${adminEmail}, from=${fromAddr}`,
        );
        const { data: sendData, error } = await this.resend.emails.send({
          from: `"Bio Vera Contact Form" <${fromAddr}>`,
          to: adminEmail,
          replyTo: data.email,
          subject: `Contact Inquiry: ${data.subject}`,
          html: mailOptions.html,
          text: mailOptions.text,
        });
        if (error) {
          this.logger.error(`Resend API error: ${JSON.stringify(error)}`);
          return false;
        }
        this.logger.log(`Contact inquiry email sent via Resend API (id=${sendData?.id})`);
        return true;
      }
      if (!this.transporter) {
        this.logger.warn(
          'Email not configured (RESEND_API_KEY or SMTP missing), skipping contact inquiry email',
        );
        return false;
      }
      this.logger.log(
        `Sending contact inquiry email: to=${adminEmail}, from=${fromAddr}, replyTo=${data.email}`,
      );
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Contact inquiry email sent successfully to ${adminEmail} from ${data.email}`);
      return true;
    } catch (error: any) {
      const errMsg = error?.message || String(error);
      const resendErr = error?.response?.body || error?.response?.data;
      const code = error?.code || error?.response?.status;
      this.logger.error(
        `Failed to send contact inquiry email: ${errMsg}${code ? ` (code=${code})` : ''}`,
        resendErr ? JSON.stringify(resendErr) : '',
      );
      return false;
    }
  }

  /**
   * Send email verification link for grower registration
   */
  async sendVerificationEmail(data: {
    email: string;
    firstName: string;
    verificationLink: string;
    expiresInHours?: number;
  }): Promise<boolean> {
    const expires = data.expiresInHours ?? 24;
    try {
      const mailOptions = {
        from: `"Bio Vera" <${process.env.EMAIL_FROM || process.env.SMTP_USER || 'info@biovera.app'}>`,
        to: data.email,
        subject: 'Verify your Bio Vera email',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2D5A27; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .button { display: inline-block; padding: 14px 28px; background-color: #2D5A27; color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
              .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
              .link { word-break: break-all; color: #2D5A27; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Bio Vera</h1>
                <p>Verify your email address</p>
              </div>
              <div class="content">
                <p>Dear <strong>${data.firstName}</strong>,</p>
                <p>Thank you for registering with Bio Vera. Please click the button below to verify your email and continue:</p>
                <p><a href="${data.verificationLink}" class="button">Verify Email</a></p>
                <p>Or copy this link: <a href="${data.verificationLink}" class="link">${data.verificationLink}</a></p>
                <p style="color: #666; font-size: 13px;">This link expires in ${expires} hours.</p>
                <p>If you did not register, you can ignore this email.</p>
                <p>Best regards,<br>Bio Vera Team</p>
              </div>
              <div class="footer">
                <p>Bio Vera - Transparency from field to shelf</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
Hello ${data.firstName},

Thank you for registering with Bio Vera. Please verify your email by clicking this link:

${data.verificationLink}

This link expires in ${expires} hours.

If you did not register, you can ignore this email.

Best regards,
Bio Vera Team
        `,
      };

      if (!this.transporter) {
        this.logger.warn('Email not configured, skipping verification email');
        return false;
      }
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Verification email sent to ${data.email}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${data.email}:`, error);
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.transporter) return false;
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error('Email service connection failed:', error);
      return false;
    }
  }
}
