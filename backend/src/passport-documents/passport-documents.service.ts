import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PassportDocumentScope,
  PassportDocumentType,
  PassportDocumentVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StoredDocumentsService } from '../stored-documents/stored-documents.service';
import { saveDurableDocument } from '../common/durable-document';

@Injectable()
export class PassportDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storedDocs: StoredDocumentsService,
  ) {}

  private async assertGrowerOwnsEstate(userId: string, estateId: string) {
    const estate = await this.prisma.estates.findFirst({ where: { id: estateId, ownerId: userId } });
    if (!estate) throw new ForbiddenException('Estate access denied');
    return estate;
  }

  async listForGrower(userId: string, batchId?: string, catalogProductId?: string) {
    const estates = await this.prisma.estates.findMany({ where: { ownerId: userId }, select: { id: true } });
    const estateIds = estates.map((e) => e.id);
    return this.prisma.passport_documents.findMany({
      where: {
        estateId: { in: estateIds },
        ...(batchId ? { batchId } : {}),
        ...(catalogProductId ? { catalogProductId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async listPublicForBatch(batchInternalId: string) {
    return this.prisma.passport_documents.findMany({
      where: {
        batchId: batchInternalId,
        scope: 'LOT',
        isPublic: true,
        verificationStatus: 'CONFIRMED',
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async listPublicForCatalogProduct(catalogProductId: string) {
    return this.prisma.passport_documents.findMany({
      where: {
        catalogProductId,
        scope: 'PRODUCT',
        isPublic: true,
        verificationStatus: 'CONFIRMED',
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async createForGrower(
    userId: string,
    input: {
      title: string;
      docType: PassportDocumentType;
      scope: PassportDocumentScope;
      issuer?: string;
      issuedAt?: string;
      expiresAt?: string;
      isPublic?: boolean;
      estateId: string;
      catalogProductId?: string;
      batchId?: string;
      plantingId?: string;
      file: { buffer: Buffer; mimetype: string; originalname?: string; size: number };
    },
  ) {
    await this.assertGrowerOwnsEstate(userId, input.estateId);
    if (!input.title?.trim()) throw new BadRequestException('Document title is required');
    if (!['PRODUCT', 'LOT', 'PLANTING', 'ESTATE'].includes(input.scope) ||
        !['CERTIFICATE', 'LAB_RESULT', 'OTHER'].includes(input.docType)) {
      throw new BadRequestException('Invalid document type or scope');
    }
    const target = { PRODUCT: input.catalogProductId, LOT: input.batchId,
      PLANTING: input.plantingId, ESTATE: input.estateId }[input.scope];
    if (!target) throw new BadRequestException('Document scope requires a matching target');
    if (input.catalogProductId && !await this.prisma.catalog_products.findFirst({
      where: { id: input.catalogProductId, estateId: input.estateId }, select: { id: true },
    })) throw new ForbiddenException('Product does not belong to this estate');
    if (input.batchId && !await this.prisma.batches.findFirst({
      where: { id: input.batchId, estateId: input.estateId }, select: { id: true },
    })) throw new ForbiddenException('Lot does not belong to this estate');
    if (input.plantingId && !await this.prisma.harvest_announcements.findFirst({
      where: { id: input.plantingId, userId, announcementType: 'PLANTING', parcel: { estateId: input.estateId } },
      select: { id: true },
    })) throw new ForbiddenException('Planting does not belong to this estate');
    for (const date of [input.issuedAt, input.expiresAt]) {
      if (date && !Number.isFinite(Date.parse(date))) throw new BadRequestException('Invalid document date');
    }
    if (input.issuedAt && input.expiresAt && Date.parse(input.expiresAt) < Date.parse(input.issuedAt)) {
      throw new BadRequestException('Expiry precedes issue date');
    }
    const fileUrl = await saveDurableDocument(this.storedDocs, input.file);
    const docId = randomUUID();
    const fileId = fileUrl.includes('/documents/')
      ? fileUrl.split('/documents/').pop()!
      : fileUrl;

    return this.prisma.passport_documents.create({
      data: {
        id: docId,
        title: input.title.trim(),
        docType: input.docType,
        scope: input.scope,
        issuer: input.issuer?.trim() || null,
        issuedAt: input.issuedAt ? new Date(input.issuedAt) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        fileDocumentId: fileId,
        isPublic: Boolean(input.isPublic),
        verificationStatus: PassportDocumentVerificationStatus.UPLOADED,
        estateId: input.estateId,
        catalogProductId: input.catalogProductId || null,
        batchId: input.batchId || null,
        plantingId: input.plantingId || null,
        uploadedByUserId: userId,
        updatedAt: new Date(),
      },
    });
  }

  documentPublicUrl(fileDocumentId: string): string {
    const apiBase = (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
    return apiBase ? `${apiBase}/documents/${fileDocumentId}` : `/documents/${fileDocumentId}`;
  }

  async listAdmin(status?: PassportDocumentVerificationStatus) {
    return this.prisma.passport_documents.findMany({
      where: status ? { verificationStatus: status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        catalog_product: { select: { id: true, name: true, variety: true } },
        batch: { select: { id: true, batchId: true, productName: true } },
      },
    });
  }

  async adminVerify(id: string, status: PassportDocumentVerificationStatus, isPublic?: boolean) {
    if (!Object.values(PassportDocumentVerificationStatus).includes(status) ||
        (isPublic !== undefined && typeof isPublic !== 'boolean')) throw new BadRequestException('Invalid document status');
    const row = await this.prisma.passport_documents.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Document not found');
    return this.prisma.passport_documents.update({
      where: { id },
      data: {
        verificationStatus: status,
        ...(isPublic !== undefined ? { isPublic } : {}),
        updatedAt: new Date(),
      },
    });
  }
}
