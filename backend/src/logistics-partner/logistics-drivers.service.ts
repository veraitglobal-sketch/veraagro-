import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLogisticsDriverDto, UpdateLogisticsDriverDto } from './dto/logistics-driver.dto';
import * as crypto from 'crypto';

@Injectable()
export class LogisticsDriversService {
  private readonly MAX_PHOTO_BYTES = 5 * 1024 * 1024;

  constructor(private readonly prisma: PrismaService) {}

  private stripDataUrlBase64(input: string): string {
    const m = input.trim().match(/^data:image\/\w+;base64,(.+)$/is);
    return m ? m[1] : input.replace(/\s/g, '');
  }

  private static guessExt(buf: Buffer): 'jpg' | 'png' | 'webp' {
    if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
    if (
      buf[0] === 0x52 &&
      buf[1] === 0x49 &&
      buf[2] === 0x46 &&
      buf[3] === 0x46 &&
      buf[8] === 0x57 &&
      buf[9] === 0x45 &&
      buf[10] === 0x42 &&
      buf[11] === 0x50
    ) {
      return 'webp';
    }
    return 'jpg';
  }

  private async persistPhotoIfNeeded(
    logisticsPartnerId: string,
    driverId: string,
    photoDataUrl: string,
  ): Promise<string> {
    const t = photoDataUrl.trim();
    if (t.startsWith('https://') || t.startsWith('http://')) return t;
    if (!t.startsWith('data:image/')) {
      throw new BadRequestException('Photo must be a data:image URL or https link');
    }
    const token = (process.env.BLOB_READ_WRITE_TOKEN || '').trim();
    if (!token) {
      if (t.length > 6 * 1024 * 1024) {
        throw new BadRequestException('Photo too large; configure blob storage or use a smaller image');
      }
      return t;
    }
    const raw = this.stripDataUrlBase64(t);
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 0) throw new BadRequestException('Invalid photo data');
    if (buf.length > this.MAX_PHOTO_BYTES) {
      throw new BadRequestException(`Photo must be at most ${this.MAX_PHOTO_BYTES} bytes`);
    }
    const ext = LogisticsDriversService.guessExt(buf);
    const key = `logistics-drivers/${logisticsPartnerId}/${driverId}-${crypto.randomUUID()}.${ext}`;
    try {
      const { put } = await import('@vercel/blob');
      const out = await put(key, buf, { access: 'public', token });
      return out.url;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new BadRequestException(`Could not upload photo: ${msg}`);
    }
  }

  async listForPartner(logisticsPartnerId: string) {
    return this.prisma.logistics_drivers.findMany({
      where: { logisticsPartnerId },
      orderBy: [{ isActive: 'desc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async createForPartner(logisticsPartnerId: string, dto: CreateLogisticsDriverDto) {
    const id = crypto.randomUUID();
    let photoUrl: string | null = null;
    if (dto.photoDataUrl?.trim()) {
      photoUrl = await this.persistPhotoIfNeeded(logisticsPartnerId, id, dto.photoDataUrl);
    }
    return this.prisma.logistics_drivers.create({
      data: {
        id,
        logisticsPartnerId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email?.trim() || null,
        phone: dto.phone?.trim() || null,
        photoUrl,
        isActive: true,
        updatedAt: new Date(),
      },
    });
  }

  async updateForPartner(
    logisticsPartnerId: string,
    driverId: string,
    dto: UpdateLogisticsDriverDto,
  ) {
    const existing = await this.prisma.logistics_drivers.findFirst({
      where: { id: driverId, logisticsPartnerId },
    });
    if (!existing) {
      throw new NotFoundException('Driver not found');
    }
    let photoUrl: string | undefined;
    if (dto.photoDataUrl?.trim()) {
      photoUrl = await this.persistPhotoIfNeeded(logisticsPartnerId, driverId, dto.photoDataUrl);
    }
    return this.prisma.logistics_drivers.update({
      where: { id: driverId },
      data: {
        ...(dto.firstName !== undefined ? { firstName: dto.firstName.trim() } : {}),
        ...(dto.lastName !== undefined ? { lastName: dto.lastName.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        updatedAt: new Date(),
      },
    });
  }
}
