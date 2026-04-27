import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  PackageBadgeType,
  Prisma,
  UserRole,
  package_badges,
  BadgePrintOrderStatus,
  PackageBadgeLifecycle,
} from '@prisma/client';
import {
  CreatePrintOrderDto,
  PreviewPrintOrderDto,
  RegisterPackageBadgesDto,
  ReceiveReturnFromGrowerDto,
  ReturnBadgesToSupplierDto,
  TransferBadgesToGrowerDto,
} from './dto/package-badges.dto';

@Injectable()
export class PackageBadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private frontendBase(): string {
    return (this.config.get<string>('FRONTEND_URL') || 'https://www.biovera.app').replace(/\/$/, '');
  }

  /**
   * Register a parent serial and optional child serials. Supplier or grower: createdBy = current user.
   * Owner defaults to current user if not passed (farmer self); supplier sets owner to grower when handing stock.
   */
  async register(userId: string, dto: RegisterPackageBadgesDto) {
    const parentSerial = dto.parentSerial.trim();
    if (!parentSerial) {
      throw new BadRequestException('parentSerial is required');
    }
    const existing = await this.prisma.package_badges.findUnique({ where: { serial: parentSerial } });
    if (existing) {
      throw new BadRequestException('Parent serial already registered');
    }

    const childSerials = [...new Set(dto.childSerials.map((s) => s.trim()).filter(Boolean))];
    for (const c of childSerials) {
      const t = await this.prisma.package_badges.findUnique({ where: { serial: c } });
      if (t) {
        throw new BadRequestException(`Child serial already exists: ${c}`);
      }
    }

    const ownerUserId = dto.ownerUserId?.trim() || userId;
    const owner = await this.prisma.users.findUnique({ where: { id: ownerUserId } });
    if (!owner) {
      throw new BadRequestException('owner user not found');
    }

    let farmerQr = dto.farmerQrCode?.trim() || owner.farmerQrCode || '';
    if (!farmerQr) {
      farmerQr = `FARMER-${owner.partnerCode}`;
    }

    let batchId: string | null = null;
    if (dto.batchId?.trim()) {
      const batch = await this.prisma.batches.findFirst({
        where: { id: dto.batchId.trim() },
        include: { estates: true },
      });
      if (!batch) {
        throw new BadRequestException('Batch not found');
      }
      if (batch.estates.ownerId !== ownerUserId) {
        throw new ForbiddenException('Batch does not belong to the badge owner');
      }
      batchId = batch.id;
    }

    let printOrderId: string | null = null;
    if (dto.printOrderId?.trim()) {
      const po = await this.prisma.badge_print_orders.findUnique({ where: { id: dto.printOrderId.trim() } });
      if (!po) {
        throw new BadRequestException('Print order not found');
      }
      if (po.requesterUserId !== userId) {
        throw new ForbiddenException('Print order belongs to another user');
      }
      printOrderId = po.id;
    }

    return this.prisma.$transaction(async (tx) => {
      const parent = await tx.package_badges.create({
        data: {
          serial: parentSerial,
          type: dto.type,
          parentId: null,
          createdByUserId: userId,
          ownerUserId,
          batchId,
          farmerQrCode: farmerQr,
          printOrderId,
        },
      });
      for (const serial of childSerials) {
        await tx.package_badges.create({
          data: {
            serial,
            type: PackageBadgeType.BOX_CHILD,
            parentId: parent.id,
            createdByUserId: userId,
            ownerUserId,
            batchId,
            farmerQrCode: farmerQr,
            printOrderId,
          },
        });
      }
      if (printOrderId) {
        await tx.badge_print_orders.update({
          where: { id: printOrderId },
          data: { status: BadgePrintOrderStatus.COMPLETED },
        });
      }
      return this.findTreeBySerialTx(tx, parentSerial);
    });
  }

  private slugPartnerCode(code: string): string {
    const s = code.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 20);
    return s || 'FARM';
  }

  buildPrintPlan(dto: PreviewPrintOrderDto, partnerCode: string, orderIndex: number) {
    const safePartner = this.slugPartnerCode(partnerCode);
    const prefix = (dto.serialPrefix?.trim() || 'PLT').toUpperCase().replace(/[^A-Z0-9_-]/g, '') || 'PLT';
    const orderRef = `BPO-${safePartner}-${String(orderIndex).padStart(4, '0')}`;
    const parents: string[] = [];
    const children: Record<string, string[]> = {};
    for (let i = 0; i < dto.parentCount; i += 1) {
      const p = `${prefix}-${orderRef}-P${String(i + 1).padStart(3, '0')}`;
      parents.push(p);
      const list: string[] = [];
      for (let j = 0; j < dto.childrenPerParent; j += 1) {
        list.push(`${p}-B${String(j + 1).padStart(3, '0')}`);
      }
      children[p] = list;
    }
    return {
      orderRef,
      parents,
      children,
      serialPrefix: prefix,
      parentCount: dto.parentCount,
      childrenPerParent: dto.childrenPerParent,
      generatedAt: new Date().toISOString(),
    };
  }

  async previewPrintOrder(_userId: string, dto: PreviewPrintOrderDto) {
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: _userId } });
    const nextIdx = (await this.prisma.badge_print_orders.count({ where: { requesterUserId: _userId } })) + 1;
    return this.buildPrintPlan(dto, user.partnerCode, nextIdx);
  }

  async createPrintOrder(userId: string, dto: CreatePrintOrderDto) {
    if (dto.printerSupplierId) {
      const p = await this.prisma.users.findUnique({ where: { id: dto.printerSupplierId } });
      if (!p) {
        throw new BadRequestException('Printer / supplier not found');
      }
      if (!p.roles?.includes('MATERIAL_SUPPLIER') && !p.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')) {
        throw new BadRequestException('Printer user should be a material supplier (or admin) for traceability');
      }
    }
    const user = await this.prisma.users.findUniqueOrThrow({ where: { id: userId } });
    const nextIdx = (await this.prisma.badge_print_orders.count({ where: { requesterUserId: userId } })) + 1;
    const plan = this.buildPrintPlan(dto, user.partnerCode, nextIdx);
    return this.prisma.badge_print_orders.create({
      data: {
        requesterUserId: userId,
        printerSupplierId: dto.printerSupplierId ?? null,
        parentCount: dto.parentCount,
        childrenPerParent: dto.childrenPerParent,
        serialPrefix: plan.serialPrefix,
        planJson: plan as object,
        notesToPrinter: dto.notesToPrinter?.trim() || null,
        status: BadgePrintOrderStatus.DRAFT,
      },
    });
  }

  async listMyPrintOrders(userId: string) {
    return this.prisma.badge_print_orders.findMany({
      where: { requesterUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async markPrintOrderSent(userId: string, orderId: string) {
    const o = await this.prisma.badge_print_orders.findUnique({ where: { id: orderId } });
    if (!o) {
      throw new NotFoundException('Print order not found');
    }
    if (o.requesterUserId !== userId) {
      throw new ForbiddenException('Not your print order');
    }
    return this.prisma.badge_print_orders.update({
      where: { id: orderId },
      data: { status: BadgePrintOrderStatus.SENT_TO_PRINTER, sentAt: new Date() },
    });
  }

  private async resolveRootRowBySerial(serial: string): Promise<package_badges> {
    let row = await this.prisma.package_badges.findUnique({ where: { serial: serial.trim() } });
    if (!row) {
      throw new NotFoundException('Badge serial not found');
    }
    while (row.parentId) {
      const p = await this.prisma.package_badges.findUnique({ where: { id: row.parentId } });
      if (!p) {
        break;
      }
      row = p;
    }
    return row;
  }

  private async treeRowIdsForRoot(rootId: string): Promise<string[]> {
    const kids = await this.prisma.package_badges.findMany({
      where: { parentId: rootId },
      select: { id: true },
    });
    return [rootId, ...kids.map((k) => k.id)];
  }

  /** Material supplier records that a grower returned physical labels; same DB effect as `returnTreeToSupplier` from grower. */
  async supplierReceiveReturnFromGrower(supplierUserId: string, dto: ReceiveReturnFromGrowerDto) {
    return this.returnTreeToSupplier(dto.fromGrowerUserId, {
      rootSerial: dto.rootSerial,
      supplierUserId,
    });
  }

  async returnTreeToSupplier(growerUserId: string, dto: ReturnBadgesToSupplierDto) {
    const root = await this.resolveRootRowBySerial(dto.rootSerial);
    if (root.ownerUserId !== growerUserId) {
      throw new ForbiddenException('You do not own this badge tree');
    }
    if (root.lifecycle !== PackageBadgeLifecycle.ACTIVE) {
      throw new BadRequestException('Tree is not active (already returned or invalid state)');
    }
    const supplier = await this.prisma.users.findUnique({ where: { id: dto.supplierUserId } });
    if (!supplier) {
      throw new BadRequestException('Supplier not found');
    }
    if (!supplier.roles?.includes('MATERIAL_SUPPLIER') && !supplier.roles?.some((r) => r === 'ADMIN' || r === 'SUPER_ADMIN')) {
      throw new BadRequestException('Return target must be a material supplier (printer/stock account)');
    }
    const ids = await this.treeRowIdsForRoot(root.id);
    await this.prisma.package_badges.updateMany({
      where: { id: { in: ids } },
      data: {
        lifecycle: PackageBadgeLifecycle.RETURNED_TO_SUPPLIER,
        ownerUserId: dto.supplierUserId,
        batchId: null,
      },
    });
    return { success: true as const, returnedIds: ids, supplierUserId: dto.supplierUserId };
  }

  async supplierTransferTreeToGrower(supplierUserId: string, dto: TransferBadgesToGrowerDto) {
    const root = await this.resolveRootRowBySerial(dto.rootSerial);
    if (root.ownerUserId !== supplierUserId) {
      throw new ForbiddenException('Your supplier account does not hold this tree');
    }
    if (root.lifecycle !== PackageBadgeLifecycle.RETURNED_TO_SUPPLIER) {
      throw new BadRequestException('Tree must be in RETURNED_TO_SUPPLIER state to re-assign');
    }
    const grower = await this.prisma.users.findUnique({ where: { id: dto.newGrowerUserId } });
    if (!grower) {
      throw new BadRequestException('Grower not found');
    }
    if (!grower.roles?.some((r) => r === 'FARMER' || r === 'GROWER' || r === 'PARTNER')) {
      throw new BadRequestException('Target must be a grower / farmer / partner');
    }
    const fq = grower.farmerQrCode?.trim() || `FARMER-${grower.partnerCode}`;
    const ids = await this.treeRowIdsForRoot(root.id);
    await this.prisma.package_badges.updateMany({
      where: { id: { in: ids } },
      data: {
        lifecycle: PackageBadgeLifecycle.ACTIVE,
        ownerUserId: dto.newGrowerUserId,
        batchId: null,
        farmerQrCode: fq,
      },
    });
    return { success: true as const, assignedTo: dto.newGrowerUserId, rowCount: ids.length };
  }

  private async findTreeBySerialTx(tx: Prisma.TransactionClient, serial: string) {
    return this.findTreeBySerialWithClient(tx, serial);
  }

  private async findTreeBySerialWithClient(
    client: Prisma.TransactionClient | PrismaService,
    serial: string,
  ) {
    const s = serial.trim();
    const row = await client.package_badges.findUnique({
      where: { serial: s },
    });
    if (!row) {
      return null;
    }
    const root = row.parentId
      ? await this.findRoot(client, row)
      : row;
    const children = await client.package_badges.findMany({
      where: { parentId: root.id },
      orderBy: { serial: 'asc' },
    });
    return { root, children, scanned: row };
  }

  private async findRoot(
    client: Prisma.TransactionClient | PrismaService,
    row: package_badges,
  ): Promise<package_badges> {
    let current: package_badges = row;
    while (current.parentId) {
      const p = await client.package_badges.findUnique({ where: { id: current.parentId } });
      if (!p) break;
      current = p;
    }
    return current;
  }

  private static readonly SCAN_PRIVILEGED: UserRole[] = [
    'ADMIN',
    'SUPER_ADMIN',
    'LOGISTICS_PARTNER',
    'DRIVER',
    'BUYER',
    'COORDINATOR',
    'PARTNER',
  ];

  /** Authenticated: full tree for logistics / grower / supplier */
  async scanTree(serial: string, requesterId: string) {
    const tree = await this.findTreeBySerialWithClient(this.prisma, serial);
    if (!tree) {
      throw new NotFoundException('Badge serial not found');
    }
    const { root, children, scanned } = tree;
    const requester = await this.prisma.users.findUnique({ where: { id: requesterId } });
    const privileged = requester?.roles.some((r) => PackageBadgesService.SCAN_PRIVILEGED.includes(r));
    if (
      !privileged &&
      root.ownerUserId !== requesterId &&
      root.createdByUserId !== requesterId
    ) {
      throw new ForbiddenException('This badge is not registered to you');
    }
    return {
      scannedSerial: scanned.serial,
      isChild: !!scanned.parentId,
      parent: {
        serial: root.serial,
        type: root.type,
        farmerQrCode: root.farmerQrCode,
        batchId: root.batchId,
        lifecycle: root.lifecycle,
      },
      children: children.map((c) => ({
        serial: c.serial,
        type: c.type,
        farmerQrCode: c.farmerQrCode,
        batchId: c.batchId,
        lifecycle: c.lifecycle,
      })),
    };
  }

  /**
   * Public: used by web/app after QR scan — redirect target + product context
   */
  async publicResolve(serial: string) {
    const s = serial.trim();
    const row = await this.prisma.package_badges.findUnique({ where: { serial: s } });
    if (!row) {
      return null;
    }
    const base = this.frontendBase();
    const fq = row.farmerQrCode?.trim();
    const farmerProfileUrl = fq ? `${base}/farmer/${encodeURIComponent(fq)}` : base;
    let publicBatchId: string | null = null;
    let passportUrl: string | null = null;
    if (row.batchId) {
      const b = await this.prisma.batches.findUnique({
        where: { id: row.batchId },
        select: { batchId: true },
      });
      publicBatchId = b?.batchId ?? null;
      if (publicBatchId) {
        passportUrl = `${base}/passport/${encodeURIComponent(publicBatchId)}`;
      }
    }
    return {
      serial: row.serial,
      type: row.type,
      farmerProfileUrl,
      farmerQrCode: row.farmerQrCode,
      publicBatchId,
      passportUrl,
      hint: 'Farmer profile for identity; passport URL for this lot when batch is linked.',
    };
  }
}
