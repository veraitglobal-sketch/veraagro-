import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']);
const MAX_BYTES = 10 * 1024 * 1024;

/** Save PDF/JPG certificate to uploads/ and return a durable public URL path. */
export function saveDurableDocument(
  file: { buffer: Buffer; mimetype: string; originalname?: string; size: number },
  subdir: string,
): string {
  if (!file?.buffer?.length) throw new BadRequestException('No file provided');
  if (file.size > MAX_BYTES) throw new BadRequestException('File exceeds 10 MB limit');
  const mime = file.mimetype.toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    throw new BadRequestException('Only PDF and JPG/PNG files are allowed');
  }

  const ext =
    mime === 'application/pdf'
      ? 'pdf'
      : mime === 'image/png'
        ? 'png'
        : 'jpg';
  const safeBase = (file.originalname || 'certificate')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 80);
  const fileName = `${safeBase}-${randomUUID().slice(0, 8)}.${ext}`;
  const relDir = path.join(subdir).replace(/\\/g, '/');
  const absDir = path.join(process.cwd(), 'uploads', relDir);
  fs.mkdirSync(absDir, { recursive: true });
  fs.writeFileSync(path.join(absDir, fileName), file.buffer);

  const apiBase = (process.env.API_PUBLIC_URL || process.env.BACKEND_URL || '').replace(/\/$/, '');
  const relPath = `/uploads/${relDir}/${fileName}`.replace(/\/+/g, '/');
  return apiBase ? `${apiBase}${relPath}` : relPath;
}
