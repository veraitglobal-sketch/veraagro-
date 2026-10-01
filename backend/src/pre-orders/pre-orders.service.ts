import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { CreatePreOrderDto, UpdatePreOrderStatusDto } from './dto';
import { currentPreOrderSeason } from './pre-order-season';

@Injectable()
export class PreOrdersService {
  private readonly logger = new Logger(PreOrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly email: EmailService,
  ) {}

  config() {
    return { season: currentPreOrderSeason(), open: true };
  }

  async create(buyerId: string, dto: CreatePreOrderDto) {
    const season = currentPreOrderSeason();
    if (dto.season !== season) {
      throw new BadRequestException(`Pre-orders are open for ${season} only.`);
    }
    const totalKg = Math.round(dto.lines.reduce((sum, l) => sum + l.quantityKg, 0) * 1000) / 1000;
    const row = await this.prisma.pre_orders.create({
      data: {
        season,
        buyerId,
        companyName: dto.companyName.trim(),
        contactPerson: dto.contactPerson.trim(),
        email: dto.email.trim(),
        phone: dto.phone?.trim() || null,
        lines: dto.lines.map((l) => ({
          productId: l.productId,
          varietyId: l.varietyId ?? null,
          label: l.label.trim(),
          quantityKg: l.quantityKg,
        })),
        totalKg,
        deliveryFrom: dto.deliveryFrom?.trim() || null,
        deliveryTo: dto.deliveryTo?.trim() || null,
        quality: dto.quality?.trim() || null,
        packaging: dto.packaging?.trim() || null,
        notes: dto.notes?.trim() || null,
      },
    });

    // The row is the record of truth; notifications and e-mail are best effort.
    await this.notifyAdmins(row.id, dto.companyName, season, totalKg, dto.lines.length);
    void this.email
      .sendContactInquiryEmail({
        name: `${dto.contactPerson} (${dto.companyName})`,
        email: dto.email,
        phone: dto.phone,
        subject: `Pre-order ${season} — ${dto.companyName}, ${totalKg} kg`,
        message: [
          ...dto.lines.map((l) => `• ${l.label}: ${l.quantityKg} kg`),
          '',
          `Delivery: ${dto.deliveryFrom || '—'} → ${dto.deliveryTo || '—'}`,
          `Quality: ${dto.quality || '—'}`,
          `Packaging: ${dto.packaging || '—'}`,
          `Notes: ${dto.notes || '—'}`,
          '',
          `Admin: /admin/pre-orders (${row.id})`,
        ].join('\n'),
      })
      .catch((e) => this.logger.warn(`pre-order e-mail failed (${row.id}): ${e}`));
    return row;
  }

  private async notifyAdmins(id: string, company: string, season: number, totalKg: number, lineCount: number) {
    const admins = await this.prisma.users.findMany({
      where: { OR: [{ roles: { has: 'SUPER_ADMIN' } }, { roles: { has: 'ADMIN' } }] },
      select: { id: true },
    });
    for (const a of admins) {
      try {
        await this.notifications.create({
          userId: a.id,
          type: 'ACTION_REQUIRED',
          title: `New pre-order ${season}`,
          message: `${company}: ${lineCount} line(s), ${totalKg} kg`,
          actionUrl: `/admin/pre-orders?id=${id}`,
        });
      } catch (e) {
        this.logger.warn(`pre-order admin notification failed for ${a.id}: ${e}`);
      }
    }
  }

  listMine(buyerId: string) {
    return this.prisma.pre_orders.findMany({ where: { buyerId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  listAll(season?: number, status?: string) {
    return this.prisma.pre_orders.findMany({
      where: {
        ...(season ? { season } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async updateStatus(adminId: string, id: string, dto: UpdatePreOrderStatusDto) {
    const existing = await this.prisma.pre_orders.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pre-order not found');
    return this.prisma.pre_orders.update({
      where: { id },
      data: {
        status: dto.status,
        adminNote: dto.adminNote?.trim() || existing.adminNote,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });
  }
}
