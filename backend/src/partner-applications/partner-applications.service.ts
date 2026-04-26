import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PartnerApplicationStatus, Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { CreatePartnerApplicationDto, AdminUpdatePartnerApplicationDto } from './dto/partner-applications.dto';

@Injectable()
export class PartnerApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async nextReferenceCode(): Promise<string> {
    for (let i = 0; i < 30; i++) {
      const code = `APP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const taken = await this.prisma.partner_applications.findUnique({ where: { referenceCode: code } });
      if (!taken) return code;
    }
    throw new ConflictException('Could not generate reference code');
  }

  async createPublic(dto: CreatePartnerApplicationDto) {
    const email = dto.email.trim().toLowerCase();
    const ref = await this.nextReferenceCode();
    const certJson: Prisma.InputJsonValue | typeof Prisma.JsonNull =
      dto.certifications && dto.certifications.length > 0
        ? (dto.certifications as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const app = await this.prisma.partner_applications.create({
      data: {
        id: crypto.randomUUID(),
        referenceCode: ref,
        companyName: dto.companyName.trim(),
        pib: dto.pib?.trim() || null,
        contactPerson: dto.contactPerson.trim(),
        email,
        phone: dto.phone?.trim() || null,
        website: dto.website?.trim() || null,
        productType: dto.productType?.trim() || null,
        certifications: certJson,
        description: dto.description?.trim() || null,
        status: 'SUBMITTED' as PartnerApplicationStatus,
        updatedAt: new Date(),
      },
    });
    return {
      id: app.id,
      referenceCode: app.referenceCode,
      message: 'Application received. Save your reference code to check status on the website.',
    };
  }

  async getByReferencePublic(code: string) {
    const trimmed = code.trim();
    const app = await this.prisma.partner_applications.findFirst({
      where: { referenceCode: { equals: trimmed, mode: 'insensitive' } },
    });
    if (!app) throw new NotFoundException('No application with this reference code');
    return {
      referenceCode: app.referenceCode,
      status: app.status,
      companyName: app.companyName,
      updatedAt: app.updatedAt,
    };
  }

  async listAdmin(filters?: { status?: PartnerApplicationStatus; search?: string }) {
    const where: Prisma.partner_applicationsWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.search?.trim()) {
      const s = filters.search.trim();
      where.OR = [
        { companyName: { contains: s, mode: 'insensitive' } },
        { email: { contains: s, mode: 'insensitive' } },
        { referenceCode: { contains: s, mode: 'insensitive' } },
        { contactPerson: { contains: s, mode: 'insensitive' } },
      ];
    }
    return this.prisma.partner_applications.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        linkedUser: { select: { id: true, partnerCode: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async getOneAdmin(id: string) {
    const app = await this.prisma.partner_applications.findUnique({
      where: { id },
      include: {
        linkedUser: { select: { id: true, partnerCode: true, email: true, firstName: true, lastName: true, roles: true } },
      },
    });
    if (!app) throw new NotFoundException();
    return app;
  }

  async updateAdmin(id: string, dto: AdminUpdatePartnerApplicationDto) {
    const existing = await this.prisma.partner_applications.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    const data: Prisma.partner_applicationsUpdateInput = { updatedAt: new Date() };
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.internalNotes !== undefined) data.internalNotes = dto.internalNotes;
    if (dto.meetingAt !== undefined) {
      data.meetingAt = dto.meetingAt && dto.meetingAt !== '' ? new Date(dto.meetingAt) : null;
    }
    if (dto.linkedUserId !== undefined) {
      if (dto.linkedUserId) {
        const u = await this.prisma.users.findUnique({ where: { id: dto.linkedUserId } });
        if (!u) throw new NotFoundException('User not found for link');
        data.linkedUser = { connect: { id: dto.linkedUserId } };
      } else {
        data.linkedUser = { disconnect: true };
      }
    }
    return this.prisma.partner_applications.update({ where: { id }, data, include: { linkedUser: true } });
  }
}
