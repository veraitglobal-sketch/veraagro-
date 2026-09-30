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

  async get(id: string): Promise<{ mimeType: string; fileName: string | null; data: Buffer }> {
    const doc = await this.prisma.stored_documents.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return {
      mimeType: doc.mimeType,
      fileName: doc.fileName,
      data: Buffer.from(doc.data),
    };
  }
}
