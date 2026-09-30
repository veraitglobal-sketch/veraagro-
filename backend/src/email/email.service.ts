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
    // Resend API key: RESEND_API_KEY, or SMTP_PASS/SMTP_PASSWORD when using Resend SMTP (same key works for REST API)
    const resendApiKey = (
      (process.env.RESEND_API_KEY || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').trim()
    );
    this.logger.log(`Resend API key: ${resendApiKey && resendApiKey.startsWith('re_') ? 'found' : 'NOT found'}`);

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
   * Send contact inquiry (general contact form only — same ADMIN_EMAIL inbox).
   */
  async sendContactInquiryEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }): Promise<boolean> {
    const h = (s: string | undefined | null) => this.escapeForEmail(s);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'info@biovera.app';
      const customFrom = process.env.EMAIL_FROM;
      const fromAddr = this.resend
        ? customFrom && customFrom.includes('@')
          ? customFrom
          : 'onboarding@resend.dev'
        : customFrom || process.env.SMTP_USER || 'info@biovera.app';

      const emailSubject = `[Bio Vera] Contact: ${data.subject}`;

      const htmlContent = `
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
                <p>New contact inquiry</p>
              </div>

              <div class="content">
                <p>You have received a new message from the Bio Vera contact form:</p>
                <div class="info-box">
                  <div style="margin: 10px 0;">
                    <span class="label">Name:</span>
                    <span>${h(data.name)}</span>
                  </div>
                  <div style="margin: 10px 0;">
                    <span class="label">Email:</span>
                    <span><a href="mailto:${h(data.email)}">${h(data.email)}</a></span>
                  </div>
                  ${
                    data.phone
                      ? `
                  <div style="margin: 10px 0;">
                    <span class="label">Phone:</span>
                    <span><a href="tel:${h(data.phone)}">${h(data.phone)}</a></span>
                  </div>
                  `
                      : ''
                  }
                  <div style="margin: 10px 0;">
                    <span class="label">Subject:</span>
                    <span>${h(data.subject)}</span>
                  </div>
                </div>

                <div class="message-box">
                  <h3 style="margin-top: 0; color: #2D5A27;">Message:</h3>
                  <p style="white-space: pre-wrap;">${h(data.message)}</p>
                </div>

                <p style="margin-top: 30px;">
                  <strong>Reply to:</strong> <a href="mailto:${h(data.email)}">${h(data.email)}</a>
                </p>
              </div>

              <div class="footer">
                <p>Bio Vera — Contact form</p>
                <p>Sent to ${h(adminEmail)}</p>
              </div>
            </div>
          </body>
          </html>
        `.trimStart();

      const textContent = `
Bio Vera — Contact inquiry

Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}Subject: ${data.subject}

Message:
${data.message}

---
Reply to: ${data.email}
        `.trimStart();

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Bio Vera Contact Form" <${fromAddr}>`,
        to: adminEmail,
        replyTo: data.email,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
      };

      if (this.resend) {
        this.logger.log(`Sending contact inquiry via Resend API: to=${adminEmail}, from=${fromAddr}`);
        const { data: sendData, error } = await this.resend.emails.send({
          from: `"Bio Vera Contact Form" <${fromAddr}>`,
          to: adminEmail,
          replyTo: data.email,
          subject: emailSubject,
          html: htmlContent,
          text: textContent,
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
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Contact inquiry email sent successfully to ${adminEmail} from ${data.email}`);
      return true;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      let resendErr: string | undefined;
      let code: string | number | undefined;
      if (error && typeof error === 'object') {
        const o = error as Record<string, unknown>;
        const oc = o['code'];
        if (typeof oc === 'string' || typeof oc === 'number') code = oc;
        const resp = o['response'];
        if (resp && typeof resp === 'object') {
          const r = resp as Record<string, unknown>;
          const body = r['body'];
          const respPayload = r['data'];
          const raw = body ?? respPayload;
          if (raw !== undefined) {
            resendErr = typeof raw === 'string' ? raw : JSON.stringify(raw);
          }
          const st = r['status'];
          if (code == null && typeof st === 'number') code = st;
        }
      }
      this.logger.error(
        `Failed to send contact inquiry email: ${errMsg}${code != null ? ` (code=${code})` : ''}`,
        resendErr ?? '',
      );
      return false;
    }
  }

  async sendCareersApplicationEmail(data: {
    name: string;
    email: string;
    phone?: string;
    roleKey?: string;
    appliedRoleTitle: string;
    coverLetter: string;
    linkedinUrl?: string;
    resumeAttachment: { filename: string; buffer: Buffer; contentType: string };
  }): Promise<boolean> {
    const h = (s: string | undefined | null) => this.escapeForEmail(s);

    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'info@biovera.app';
      const customFrom = process.env.EMAIL_FROM;
      const fromAddr = this.resend
        ? customFrom && customFrom.includes('@')
          ? customFrom
          : 'onboarding@resend.dev'
        : customFrom || process.env.SMTP_USER || 'info@biovera.app';

      const attachment = data.resumeAttachment;
      const emailSubject = `[Bio Vera] Careers: ${data.appliedRoleTitle}`;
      const ln = data.linkedinUrl ? this.parseLinkedInUrl(data.linkedinUrl) : undefined;

      const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 620px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2D5A27; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .info-box { background-color: white; border-left: 4px solid #2D5A27; padding: 15px; margin: 15px 0; }
              .label { font-weight: bold; color: #2D5A27; display: inline-block; min-width: 120px; }
              .message-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; border: 1px solid #ddd; }
              .pill { margin:15px 0;padding:12px;background:#eaf3e9;border-radius:8px;border:1px solid #2D5A27;font-size:14px;}
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🌱 Bio Vera</h1>
                <p>New job application</p>
              </div>
              <div class="content">
                <p class="pill"><strong>CV attached:</strong> ${h(attachment.filename)}</p>
                <div class="info-box">
                  <div style="margin: 10px 0;"><span class="label">Name:</span> <span>${h(data.name)}</span></div>
                  <div style="margin: 10px 0;"><span class="label">Email:</span> <span><a href="mailto:${h(data.email)}">${h(data.email)}</a></span></div>
                  ${data.phone ? `<div style="margin: 10px 0;"><span class="label">Phone:</span> <span><a href="tel:${h(data.phone)}">${h(data.phone)}</a></span></div>` : ''}
                  <div style="margin: 10px 0;"><span class="label">Role:</span> <span>${h(data.appliedRoleTitle)}${data.roleKey ? ` — ${h(data.roleKey)}` : ''}</span></div>
                  ${
                    ln
                      ? `<div style="margin: 10px 0;"><span class="label">LinkedIn:</span> <span><a href="${ln.href}" target="_blank" rel="noopener noreferrer">${h(ln.display)}</a></span></div>`
                      : ''
                  }
                </div>
                <div class="message-box">
                  <h3 style="margin-top: 0; color: #2D5A27;">Cover letter:</h3>
                  <p style="white-space: pre-wrap;">${h(data.coverLetter)}</p>
                </div>
                <p><strong>Reply to:</strong> <a href="mailto:${h(data.email)}">${h(data.email)}</a></p>
              </div>
              <div style="text-align:center;padding:20px;color:#666;font-size:12px;"><p>Bio Vera — Careers application</p><p>Sent to ${h(adminEmail)}</p></div>
            </div>
          </body>
          </html>
        `.trimStart();

      const textContent = `
Bio Vera — Careers application — ${data.appliedRoleTitle}${data.roleKey ? ` [${data.roleKey}]` : ''}

Applicant
Name: ${data.name}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}\n` : ''}${ln ? `LinkedIn: ${ln.display}\n` : ''}

CV attachment: ${attachment.filename}

Cover letter:
${data.coverLetter}

---
Reply to: ${data.email}
        `.trimStart();

      const mailOptions: nodemailer.SendMailOptions = {
        from: `"Bio Vera Careers" <${fromAddr}>`,
        to: adminEmail,
        replyTo: data.email,
        subject: emailSubject,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: attachment.filename,
            content: attachment.buffer,
            contentType: attachment.contentType,
          },
        ],
      };

      if (this.resend) {
        this.logger.log(
          `Sending careers application via Resend: to=${adminEmail}, role=${data.roleKey ?? '-'}`,
        );
        const { data: sendData, error } = await this.resend.emails.send({
          from: `"Bio Vera Careers" <${fromAddr}>`,
          to: adminEmail,
          replyTo: data.email,
          subject: emailSubject,
          html: htmlContent,
          text: textContent,
          attachments: [
            {
              filename: attachment.filename,
              content: attachment.buffer,
              contentType: attachment.contentType,
            },
          ],
        });
        if (error) {
          this.logger.error(`Resend careers API error: ${JSON.stringify(error)}`);
          return false;
        }
        this.logger.log(`Careers email sent via Resend (id=${sendData?.id})`);
        return true;
      }
      if (!this.transporter) {
        this.logger.warn('Email not configured, skipping careers application email');
        return false;
      }
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send careers application email: ${errMsg}`);
      return false;
    }
  }

  private escapeForEmail(s: string | undefined | null): string {
    if (s == null || s === '') return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private parseLinkedInUrl(raw: string): { href: string; display: string } | undefined {
    const t = raw.trim();
    if (!t) return undefined;
    let urlStr = t;
    if (!/^https?:\/\//i.test(urlStr)) urlStr = `https://${urlStr}`;
    try {
      const p = new URL(urlStr);
      const host = p.hostname.toLowerCase();
      if (host !== 'linkedin.com' && host !== 'www.linkedin.com' && !host.endsWith('.linkedin.com')) {
        return undefined;
      }
      const hrefSafe = String(p.href).replace(/"/g, '%22');
      return { href: hrefSafe, display: t };
    } catch {
      return undefined;
    }
  }


  /**
   * Notify operations (e.g. info@biovera.app) of a new buyer order or pre-order.
   * Target: ORDERS_NOTIFY_EMAIL → ADMIN_EMAIL → info@biovera.app
   */
  async sendNewOrderAdminNotification(data: {
    orderNumber: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    totalAmount: number | null;
    buyerName: string;
    buyerEmail?: string | null;
    estateName: string;
    isPreOrder?: boolean;
    extraNotes?: string | null;
  }): Promise<boolean> {
    try {
      const toAddr =
        process.env.ORDERS_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'info@biovera.app';
      const customFrom = process.env.EMAIL_FROM;
      const fromAddr = this.resend
        ? customFrom && customFrom.includes('@')
          ? customFrom
          : 'onboarding@resend.dev'
        : customFrom || process.env.SMTP_USER || 'info@biovera.app';

      const h = (v: string | undefined | null) => this.escapeForEmail(v);
      const subj = data.isPreOrder
        ? `Pre-order: ${data.orderNumber}`
        : `New order: ${data.orderNumber}`;
      const tot =
        data.totalAmount != null ? `€${data.totalAmount.toFixed(2)}` : '—';
      const up =
        data.unitPrice != null ? `€${data.unitPrice.toFixed(2)}` : '—';
      const kind = data.isPreOrder ? 'Pre-order' : 'New order';
      const notesBlock = data.extraNotes
        ? `<p><span class="label">Notes:</span> ${h(data.extraNotes)}</p>`
        : '';

      const mailOptions = {
        from: `"Bio Vera Orders" <${fromAddr}>`,
        to: toAddr,
        replyTo: data.buyerEmail || undefined,
        subject: subj,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2D5A27; color: white; padding: 20px; text-align: center; }
              .content { background-color: #f9f9f9; padding: 30px; }
              .info-box { background-color: white; border-left: 4px solid #2D5A27; padding: 15px; margin: 15px 0; }
              .label { font-weight: bold; color: #2D5A27; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Bio Vera</h1>
                <p>${h(kind)}</p>
              </div>
              <div class="content">
                <div class="info-box">
                  <p><span class="label">Order #</span> ${h(data.orderNumber)}</p>
                  <p><span class="label">Product</span> ${h(data.productName)}</p>
                  <p><span class="label">Quantity</span> ${h(String(data.quantity))} ${h(data.unit)}</p>
                  <p><span class="label">Unit price</span> ${up}</p>
                  <p><span class="label">Total</span> ${tot}</p>
                  <p><span class="label">Buyer</span> ${h(data.buyerName)}${
                    data.buyerEmail
                      ? ` — <a href="mailto:${String(data.buyerEmail).replace(
                          /"/g,
                          '',
                        )}">${h(data.buyerEmail)}</a>`
                      : ''
                  }</p>
                  <p><span class="label">Estate / context</span> ${h(
                    data.estateName,
                  )}</p>
                  ${notesBlock}
                </div>
                <p style="color:#666;font-size:12px;">Open the admin panel → Orders to manage this order.</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `${kind} ${data.orderNumber}
Product: ${data.productName}
Quantity: ${data.quantity} ${data.unit}
Unit price: ${up}
Total: ${tot}
Buyer: ${data.buyerName}${data.buyerEmail ? ` <${data.buyerEmail}>` : ''}
Estate / context: ${data.estateName}
${data.extraNotes ? `Notes: ${data.extraNotes}\n` : ''}`,
      };

      if (this.resend) {
        this.logger.log(
          `Sending new-order email via Resend: to=${toAddr}, from=${fromAddr}`,
        );
        const { error } = await this.resend.emails.send({
          from: mailOptions.from,
          to: toAddr,
          replyTo: data.buyerEmail || undefined,
          subject: mailOptions.subject,
          html: mailOptions.html,
          text: mailOptions.text,
        });
        if (error) {
          this.logger.error(`Resend new-order error: ${JSON.stringify(error)}`);
          return false;
        }
        this.logger.log(`New order notification sent to ${toAddr}`);
        return true;
      }
      if (!this.transporter) {
        this.logger.warn(
          'Email not configured, skipping new order notification',
        );
        return false;
      }
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`New order notification sent via SMTP to ${toAddr}`);
      return true;
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send new order notification: ${detail}`);
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
   * Send generated invoice PDF to the buyer (Resend with attachment or SMTP).
   */
  async sendInvoicePdf(data: {
    to: string;
    firstName: string;
    lastName: string;
    invoiceNumber: string;
    orderNumber: string;
    pdfBuffer: Buffer;
  }): Promise<boolean> {
    if (!this.resend && !this.transporter) {
      this.logger.warn('Email not configured, skipping invoice email');
      return false;
    }
    const fromAddr = process.env.EMAIL_FROM || process.env.SMTP_USER || 'info@biovera.app';
    const name = `${data.firstName} ${data.lastName}`.trim() || 'Customer';
    const subj = `Invoice ${data.invoiceNumber} — order ${data.orderNumber}`;
    const filename = `invoice-${data.invoiceNumber.replace(/[^a-zA-Z0-9._-]+/g, '_')}.pdf`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <p>Dear <strong>${name}</strong>,</p>
        <p>Please find your Bio Vera invoice <strong>${data.invoiceNumber}</strong> for order <strong>${data.orderNumber}</strong> attached.</p>
        <p>Thank you for your business.</p>
        <p style="color:#666;font-size:12px;">Bio Vera — transparency from field to shelf</p>
      </body>
      </html>
    `;
    const text = `Dear ${name},\n\nPlease find your invoice ${data.invoiceNumber} (order ${data.orderNumber}) attached.\n\n— Bio Vera`;
    const att = { filename, content: data.pdfBuffer };
    try {
      if (this.resend) {
        const { error } = await this.resend.emails.send({
          from: `"Bio Vera" <${fromAddr}>`,
          to: data.to,
          subject: subj,
          html,
          text,
          attachments: [
            {
              filename: att.filename,
              content: data.pdfBuffer,
            },
          ],
        });
        if (error) {
          this.logger.error(`Resend invoice error: ${JSON.stringify(error)}`);
          return false;
        }
        this.logger.log(`Invoice email sent to ${data.to} (${data.invoiceNumber})`);
        return true;
      }
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"Bio Vera" <${fromAddr}>`,
          to: data.to,
          subject: subj,
          html,
          text,
          attachments: [att],
        });
        this.logger.log(`Invoice email sent via SMTP to ${data.to} (${data.invoiceNumber})`);
        return true;
      }
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : String(e);
      this.logger.error(`Failed to send invoice email: ${detail}`);
      return false;
    }
    return false;
  }

  /** Notify buyer their account was approved by admin. */
  async sendBuyerAccountApprovedEmail(data: {
    email: string;
    firstName: string;
  }): Promise<boolean> {
    const webUrl = process.env.FRONTEND_URL || process.env.WEB_URL || 'https://biovera.app';
    const loginUrl = `${webUrl.replace(/\/$/, '')}/login/buyer`;
    const marketplaceUrl = `${webUrl.replace(/\/$/, '')}/buyer-portal/marketplace`;
    const subject = 'Your Bio Vera buyer account is active';
    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8" /></head>
      <body style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <p>Dear <strong>${data.firstName}</strong>,</p>
        <p>Your Bio Vera buyer account is active — you can now order from the Marketplace.</p>
        <p><a href="${marketplaceUrl}" style="display:inline-block;padding:12px 24px;background:#2D5A27;color:#fff;text-decoration:none;border-radius:8px;">Browse marketplace</a></p>
        <p>Sign in with your e-mail or partner code: <a href="${loginUrl}">${loginUrl}</a></p>
        <p style="color:#666;font-size:12px;">Bio Vera — transparency from field to shelf</p>
      </body>
      </html>
    `;
    const text = `Dear ${data.firstName},\n\nYour Bio Vera buyer account is active — you can now order from the Marketplace.\n\nSign in: ${loginUrl}\nMarketplace: ${marketplaceUrl}\n\n— Bio Vera`;
    return this.sendSimpleEmail({ to: data.email, subject, html, text });
  }

  private async sendSimpleEmail(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<boolean> {
    const fromAddr = process.env.EMAIL_FROM || process.env.SMTP_USER || 'info@biovera.app';
    try {
      if (this.resend) {
        const { error } = await this.resend.emails.send({
          from: `"Bio Vera" <${fromAddr}>`,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        if (error) {
          this.logger.error(`Resend email error: ${JSON.stringify(error)}`);
          return false;
        }
        return true;
      }
      if (this.transporter) {
        await this.transporter.sendMail({
          from: `"Bio Vera" <${fromAddr}>`,
          to: data.to,
          subject: data.subject,
          html: data.html,
          text: data.text,
        });
        return true;
      }
      this.logger.warn('Email not configured, skipping send');
      return false;
    } catch (e: unknown) {
      this.logger.error(`sendSimpleEmail failed: ${e instanceof Error ? e.message : e}`);
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
