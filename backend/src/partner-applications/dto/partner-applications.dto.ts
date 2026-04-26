import { IsString, IsEmail, IsOptional, IsIn, IsArray } from 'class-validator';
import { PartnerApplicationStatus } from '@prisma/client';

const STATUSES: PartnerApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'CONTACTED',
  'MEETING_SCHEDULED',
  'NEGOTIATION',
  'APPROVED',
  'REJECTED',
  'ONBOARDED',
];

export class CreatePartnerApplicationDto {
  @IsString()
  companyName: string;

  @IsString()
  @IsOptional()
  pib?: string;

  @IsString()
  contactPerson: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  productType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  certifications?: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

export class AdminUpdatePartnerApplicationDto {
  @IsOptional()
  @IsIn(STATUSES)
  status?: PartnerApplicationStatus;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  /** ISO date string for scheduled meeting */
  @IsString()
  @IsOptional()
  meetingAt?: string | null;

  @IsString()
  @IsOptional()
  linkedUserId?: string | null;
}
