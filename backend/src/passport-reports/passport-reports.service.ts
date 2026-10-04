import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PassportReportStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoredDocumentsService } from '../stored-documents/stored-documents.service';
import { CreatePassportReportDto } from './dto/create-passport-report.dto';

@Injectable()
export class PassportReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documents: StoredDocumentsService,
  ) {}

  private reportNumber(): string {
    const y = new Date().getFullYear();
    const n = Math.floor(Math.random() * 900000) + 100000;
    return `PR-${y}-${n}`;
  }

  async createPublicReport(
    publicBatchId: string,
    badgeSerial: string | undefined,
    dto: CreatePassportReportDto,
  ) {
    const batch = await this.prisma.batches.findFirst({
      where: { batchId: publicBatchId },
      select: { id: true, batchId: true },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    if (badgeSerial?.trim()) {
      const badge = await this.prisma.package_badges.findUnique({ where: { serial: badgeSerial.trim() } });
      if (!badge || badge.batchId !== batch.id || badge.lifecycle !== 'ACTIVE') {
        throw new BadRequestException('The package label does not identify this lot');
      }
    }

    const idempotencyKey = dto.idempotencyKey?.trim() || null;
    if (idempotencyKey) {
      const existing = await this.prisma.passport_reports.findFirst({
        where: { batchId: batch.id, idempotencyKey },
      });
      if (existing) {
        return {
          reportNumber: existing.reportNumber,
          status: existing.status,
          duplicate: true,
        };
      }
    }

    let photoDocumentId: string | null = null;
    if (dto.photoDataUrl?.startsWith('data:image/')) {
      photoDocumentId = await this.documents.storeDataUrl(dto.photoDataUrl, 'passport-report.jpg');
    }

    try {
      const row = await this.prisma.passport_reports.create({
        data: {
          id: randomUUID(),
          reportNumber: this.reportNumber(),
          batchId: batch.id,
          publicBatchId: batch.batchId,
          badgeSerial: badgeSerial?.trim() || null,
          description: dto.description.trim(),
          photoDocumentId,
          contactEmail: dto.contactEmail?.trim() || null,
          contactPhone: dto.contactPhone?.trim() || null,
          idempotencyKey,
          updatedAt: new Date(),
        },
      });
      return { reportNumber: row.reportNumber, status: row.status, duplicate: false };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002' && idempotencyKey) {
        const existing = await this.prisma.passport_reports.findFirst({
          where: { batchId: batch.id, idempotencyKey },
        });
        if (existing) {
          return { reportNumber: existing.reportNumber, status: existing.status, duplicate: true };
        }
        throw new ConflictException('Duplicate report');
      }
      throw err;
    }
  }

  async listAdmin(status?: PassportReportStatus) {
    return this.prisma.passport_reports.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async getAdmin(id: string) {
    const row = await this.prisma.passport_reports.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Report not found');
    const batch = await this.prisma.batches.findUnique({
      where: { id: row.batchId },
      select: {
        batchId: true,
        productName: true,
        quantity: true,
        unit: true,
        harvestDate: true,
        catalog_product: { select: { name: true, variety: true } },
      },
    });
    return { ...row, batch };
  }

  async updateStatus(
    id: string,
    status: PassportReportStatus,
    adminUserId: string,
    adminNotes?: string,
  ) {
    const row = await this.prisma.passport_reports.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Report not found');
    if (!['NEW', 'IN_PROGRESS', 'RESOLVED'].includes(status)) {
      throw new BadRequestException('Invalid status');
    }
    return this.prisma.passport_reports.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes === undefined ? row.adminNotes : adminNotes.trim() || null,
        resolvedBy: status === 'RESOLVED' ? adminUserId : null,
        resolvedAt: status === 'RESOLVED' ? row.resolvedAt ?? new Date() : null,
        updatedAt: new Date(),
      },
    });
  }
}
