import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const ALLOWED_DOC_TYPES = ['ID_FRONT', 'ID_BACK', 'PASSPORT', 'LAND_REGISTRY', 'LEASE'] as const;

@Injectable()
export class KycService {
  constructor(private prisma: PrismaService) {}

  async uploadDocument(
    userId: string,
    docType: string,
    fileUrl: string,
  ) {
    if (!ALLOWED_DOC_TYPES.includes(docType as any)) {
      throw new BadRequestException(`Invalid docType. Allowed: ${ALLOWED_DOC_TYPES.join(', ')}`);
    }

    const existing = await this.prisma.kyc_documents.findFirst({
      where: { userId, docType },
    });

    const data = {
      id: crypto.randomUUID(),
      userId,
      docType,
      fileUrl,
      status: 'PENDING',
    };

    if (existing) {
      return this.prisma.kyc_documents.update({
        where: { id: existing.id },
        data: { fileUrl, status: 'PENDING', verifiedAt: null, verifiedBy: null, rejectionReason: null },
      });
    }

    return this.prisma.kyc_documents.create({ data });
  }

  async getMyDocuments(userId: string) {
    return this.prisma.kyc_documents.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDocumentsByUser(userId: string, adminId: string) {
    // Admin or self only
    const admin = await this.prisma.users.findUnique({
      where: { id: adminId },
      select: { roles: true },
    });
    const isAdmin = admin?.roles?.some((r: string) => ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR'].includes(r));
    if (!isAdmin && adminId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.prisma.kyc_documents.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyDocument(documentId: string, adminId: string, approved: boolean, reason?: string) {
    const doc = await this.prisma.kyc_documents.findUnique({ where: { id: documentId } });
    if (!doc) throw new NotFoundException('Document not found');

    return this.prisma.kyc_documents.update({
      where: { id: documentId },
      data: {
        status: approved ? 'VERIFIED' : 'REJECTED',
        verifiedAt: approved ? new Date() : null,
        verifiedBy: adminId,
        rejectionReason: approved ? null : (reason || 'Rejected by admin'),
      },
    });
  }

  async getKycStatus(userId: string) {
    const docs = await this.prisma.kyc_documents.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    const required = ['ID_FRONT', 'ID_BACK'];
    const hasRequired = required.every(
      (t) => docs.some((d) => d.docType === t && d.status === 'VERIFIED')
    );
    const pending = docs.filter((d) => d.status === 'PENDING').length;
    const rejected = docs.filter((d) => d.status === 'REJECTED').length;
    return {
      complete: hasRequired,
      pending,
      rejected,
      documents: docs.map((d) => ({ docType: d.docType, status: d.status })),
    };
  }
}
