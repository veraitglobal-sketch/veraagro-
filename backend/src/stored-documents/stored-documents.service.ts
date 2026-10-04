import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoredDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async save(
    file: { buffer: Buffer; mimetype: string; originalname?: string },
  ): Promise<string> {
    const id = randomUUID();
    await this.prisma.stored_documents.create({
      data: {
        id,
        mimeType: file.mimetype.toLowerCase(),
        fileName: file.originalname?.slice(0, 200) ?? null,
        data: file.buffer,
      },
    });
    const apiBase = (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
    const relPath = `/documents/${id}`;
    return apiBase ? `${apiBase}${relPath}` : relPath;
  }

  /** Store base64 data URL; returns document id for internal references. */
  async storeDataUrl(dataUrl: string, fileName = 'upload.jpg'): Promise<string> {
    const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl.trim());
    if (!match) throw new NotFoundException('Invalid image data');
    const mimeType = match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    const id = randomUUID();
    await this.prisma.stored_documents.create({
      data: { id, mimeType, fileName: fileName.slice(0, 200), data: buffer },
    });
    return id;
  }

  async get(id: string, actor?: { id: string; roles: string[] }): Promise<{ mimeType: string; fileName: string | null; data: Buffer }> {
    const [passportDocs, report] = await Promise.all([
      this.prisma.passport_documents.findMany({ where: { fileDocumentId: id } }),
      this.prisma.passport_reports.findFirst({ where: { photoDocumentId: id }, select: { id: true } }),
    ]);
    const admin = actor?.roles?.some(role => ['ADMIN', 'SUPER_ADMIN'].includes(role));
    if (!admin && report) throw new NotFoundException('Document not found');
    if (!admin && passportDocs.length && !passportDocs.some(d => d.isPublic && d.verificationStatus === 'CONFIRMED')) {
      const ownEstate = actor && await this.prisma.estates.findFirst({
        where: { id: { in: passportDocs.map(d => d.estateId).filter((x): x is string => !!x) }, ownerId: actor.id },
        select: { id: true },
      });
      if (!ownEstate) throw new NotFoundException('Document not found');
    }
    const doc = await this.prisma.stored_documents.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return {
      mimeType: doc.mimeType,
      fileName: doc.fileName,
      data: Buffer.from(doc.data),
    };
  }
}
