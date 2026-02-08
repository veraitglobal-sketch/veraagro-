import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ContactService } from './contact.service';
import { Throttle } from '@nestjs/throttler';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class ContactInquiryDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * Submit contact form inquiry
   * POST /contact/submit
   * 
   * Rate limited to prevent spam: 5 requests per 15 minutes
   */
  @Post('submit')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  async submitInquiry(@Body() dto: ContactInquiryDto) {
    // Basic validation
    if (!dto.name || !dto.email || !dto.subject || !dto.message) {
      return {
        success: false,
        message: 'All required fields must be filled.',
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dto.email)) {
      return {
        success: false,
        message: 'Please provide a valid email address.',
      };
    }

    return this.contactService.submitContactInquiry(dto);
  }
}
