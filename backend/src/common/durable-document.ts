import { BadRequestException } from '@nestjs/common';
import type { StoredDocumentsService } from '../stored-documents/stored-documents.service';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

export function assertCertificateFile(file: { buffer: Buffer; mimetype: string; size: number }) {
  if (!file?.buffer?.length) throw new BadRequestException('No file provided');
  if (file.size > MAX_DOCUMENT_BYTES) throw new BadRequestException('File exceeds 10 MB limit');
  const mime = file.mimetype.toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new BadRequestException('Only PDF and JPG/PNG files are allowed');
  }
}

/** Save PDF/JPG certificate to PostgreSQL and return a durable public URL path. */
export async function saveDurableDocument(
  documents: StoredDocumentsService,
  file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
): Promise<string> {
  assertCertificateFile(file);
  return documents.save(file);
}
