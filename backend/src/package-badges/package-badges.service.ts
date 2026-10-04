import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
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
  ReceiveFromFactoryDto,
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

  private planJsonShape(plan: unknown): {
    parents: string[];
    children: Record<string, string[]>;
    serialPrefix?: string;
  } | null {
    if (!plan || typeof plan !== 'object') return null;
    const p = plan as Record<string, unknown>;
    const parents = Array.isArray(p.parents) ? p.parents.filter((x): x is string => typeof x === 'string') : [];
    const childrenRaw = p.children;
    const children: Record<string, string[]> = {};
    if (childrenRaw && typeof childrenRaw === 'object' && !Array.isArray(childrenRaw)) {
      for (const [k, v] of Object.entries(childrenRaw as Record<string, unknown>)) {
        if (Array.isArray(v)) {
          children[k] = v.filter((x): x is string => typeof x === 'string');
        }
      }
    }
    const serialPrefix = typeof p.serialPrefix === 'string' ? p.serialPrefix : undefined;
    return { parents, children, serialPrefix };
  }

  private inferBadgeTypeFromPlan(
    parentSerial: string,
    plan: { serialPrefix?: string } | null,
    explicit?: PackageBadgeType,
  ): PackageBadgeType {
    if (explicit) return explicit;
    const prefix = (plan?.serialPrefix || parentSerial.split('-')[0] || '').toUpperCase();
    if (prefix.includes('ROLL') || prefix === 'RL') {
      return PackageBadgeType.ROLL_LINE;
    }
    return PackageBadgeType.PALLET_MASTER;
  }

  private async resolveGrowerUserId(dto: TransferBadgesToGrowerDto): Promise<string> {
    if (dto.newGrowerUserId?.trim()) {
      return dto.newGrowerUserId.trim();
    }
    if (dto.farmerQrCode?.trim()) {
      const u = await this.prisma.users.findFirst({
        where: { farmerQrCode: dto.farmerQrCode.trim() },
      });
      if (!u) {
        throw new NotFoundException('Grower not found for this farmer QR code');
      }
      return u.id;
    }
    if (dto.growerPartnerCode?.trim()) {
      const u = await this.prisma.users.findFirst({
        where: { partnerCode: dto.growerPartnerCode.trim() },
      });
      if (!u) {
        throw new NotFoundException('Grower not found for this partner code');
      }
      return u.id;
    }
    throw new BadRequestException('Provide newGrowerUserId, farmerQrCode, or growerPartnerCode');
  }

  private async findPrintOrderForSerial(
    serial: string,
    supplierUserId: string,
    printOrderIdHint?: string,
  ): Promise<{
    printOrderId: string;
    parentSerial: string;
    childSerials: string[];
    badgeType: PackageBadgeType;
  } | null> {
    const s = serial.trim();
    if (printOrderIdHint?.trim()) {
      const po = await this.prisma.badge_print_orders.findUnique({ where: { id: printOrderIdHint.trim() } });
      if (!po) {
        throw new NotFoundException('Print order not found');
      }
      const plan = this.planJsonShape(po.planJson);
      if (!plan) {
        throw new BadRequestException('Print order has invalid planJson');
      }
      const match = this.matchSerialInPlan(s, plan);
      if (!match) {
        throw new BadRequestException('Serial not found in this print order plan');
      }
      return {
        printOrderId: po.id,
        parentSerial: match.parentSerial,
        childSerials: match.childSerials,
        badgeType: this.inferBadgeTypeFromPlan(match.parentSerial, plan),
      };
    }

    const orders = await this.prisma.badge_print_orders.findMany({
      where: {
        OR: [{ printerSupplierId: supplierUserId }, { printerSupplierId: null }],
        status: { in: [BadgePrintOrderStatus.SENT_TO_PRINTER, BadgePrintOrderStatus.DRAFT] },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    for (const po of orders) {
      const plan = this.planJsonShape(po.planJson);
      if (!plan) continue;
      const match = this.matchSerialInPlan(s, plan);
      if (match) {
        return {
          printOrderId: po.id,
          parentSerial: match.parentSerial,
          childSerials: match.childSerials,
          badgeType: this.inferBadgeTypeFromPlan(match.parentSerial, plan),
        };
      }
    }
    return null;
  }

  private matchSerialInPlan(
    serial: string,
    plan: { parents: string[]; children: Record<string, string[]> },
  ): { parentSerial: string; childSerials: string[] } | null {
    const s = serial.trim();
    if (plan.parents.includes(s)) {
      return { parentSerial: s, childSerials: plan.children[s] ?? [] };
    }
    for (const [parent, kids] of Object.entries(plan.children)) {
      if (kids.includes(s)) {
        return { parentSerial: parent, childSerials: plan.children[parent] ?? [] };
      }
    }
    return null;
  }

  /** Supplier intake: scan master (or child) sticker when shipment arrives from factory. */
  async supplierReceiveFromFactory(supplierUserId: string, dto: ReceiveFromFactoryDto) {
    const scanned = dto.rootSerial.trim();
    if (!scanned) {
      throw new BadRequestException('rootSerial is required');
    }

    const existingTree = await this.findTreeBySerialWithClient(this.prisma, scanned);
    if (existingTree) {
      const { root } = existingTree;
      if (root.ownerUserId === supplierUserId && root.lifecycle === PackageBadgeLifecycle.ACTIVE) {
        return existingTree;
      }
      if (root.ownerUserId && root.ownerUserId !== supplierUserId) {
        throw new ForbiddenException('This badge tree is already registered to another account');
      }
    }

    const fromPlan = await this.findPrintOrderForSerial(scanned, supplierUserId, dto.printOrderId);
    const parentSerial = fromPlan?.parentSerial ?? scanned;
    const childSerials =
      dto.childSerials?.map((c) => c.trim()).filter(Boolean) ?? fromPlan?.childSerials ?? [];
    const badgeType =
      dto.type ?? fromPlan?.badgeType ?? this.inferBadgeTypeFromPlan(parentSerial, null, dto.type);

    if (!fromPlan && childSerials.length === 0) {
      throw new BadRequestException(
        'No print order matched this serial. Pass childSerials[] or printOrderId if the factory plan is not in the system yet.',
      );
    }

    return this.register(supplierUserId, {
      parentSerial,
      type: badgeType,
      childSerials,
      ownerUserId: supplierUserId,
      printOrderId: fromPlan?.printOrderId,
    });
  }

  private async ensureLabelInventoryForGrower(rootSerial: string, growerUserId: string) {
    let labelType = await this.prisma.material_types.findFirst({
      where: { type: 'LABEL', isActive: true },
    });
    if (!labelType) {
      const now = new Date();
      labelType = await this.prisma.material_types.create({
        data: {
          id: crypto.randomUUID(),
          name: 'Bio Vera Label roll',
          type: 'LABEL',
          unit: 'roll',
          unitPrice: 0.1,
          description: 'Official sticker / QR label roll',
          isActive: true,
          updatedAt: now,
        },
      });
    }

    const existing = await this.prisma.material_inventory.findUnique({
      where: { serialNumber: rootSerial },
    });
    const now = new Date();
    if (existing) {
      await this.prisma.material_inventory.update({
        where: { id: existing.id },
        data: {
          materialTypeId: labelType.id,
          soldToUserId: growerUserId,
          soldAt: now,
          status: 'AVAILABLE',
          usedInBatchId: null,
          usedAt: null,
          updatedAt: now,
        },
      });
      return;
    }

    await this.prisma.material_inventory.create({
      data: {
        id: crypto.randomUUID(),
        materialTypeId: labelType.id,
        serialNumber: rootSerial,
        status: 'AVAILABLE',
        soldToUserId: growerUserId,
        soldAt: now,
        updatedAt: now,
      },
    });
  }

  async listSupplierStock(supplierUserId: string) {
    const roots = await this.prisma.package_badges.findMany({
      where: {
        ownerUserId: supplierUserId,
        parentId: null,
        lifecycle: PackageBadgeLifecycle.ACTIVE,
      },
      include: {
        children: { select: { id: true, serial: true }, orderBy: { serial: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return roots.map((r) => ({
      serial: r.serial,
      type: r.type,
      childCount: r.children.length,
      batchId: r.batchId,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async listGrowerPackages(growerUserId: string) {
    const roots = await this.prisma.package_badges.findMany({
      where: {
        ownerUserId: growerUserId,
        parentId: null,
        lifecycle: PackageBadgeLifecycle.ACTIVE,
      },
      include: {
        children: { select: { serial: true, batchId: true }, orderBy: { serial: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return roots.map((r) => ({
      serial: r.serial,
      type: r.type,
      childCount: r.children.length,
      batchId: r.batchId,
      usedOnLot: r.batchId != null,
      soldAt: r.createdAt.toISOString(),
    }));
  }

  async supplierTransferTreeToGrower(supplierUserId: string, dto: TransferBadgesToGrowerDto) {
    const growerUserId = await this.resolveGrowerUserId(dto);
    const root = await this.resolveRootRowBySerial(dto.rootSerial);
    if (root.ownerUserId !== supplierUserId) {
      throw new ForbiddenException('Your supplier account does not hold this tree');
    }
    const allowedLifecycle =
      root.lifecycle === PackageBadgeLifecycle.RETURNED_TO_SUPPLIER ||
      root.lifecycle === PackageBadgeLifecycle.ACTIVE;
    if (!allowedLifecycle) {
      throw new BadRequestException('Tree is not available for handover to a grower');
    }
    if (root.batchId) {
      throw new BadRequestException('This package was already used on a lot and cannot be re-sold');
    }
    const grower = await this.prisma.users.findUnique({ where: { id: growerUserId } });
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
        ownerUserId: growerUserId,
        batchId: null,
        farmerQrCode: fq,
      },
    });
    if (root.type === PackageBadgeType.ROLL_LINE || root.type === PackageBadgeType.PALLET_MASTER) {
      await this.ensureLabelInventoryForGrower(root.serial, growerUserId);
    }
    return {
      success: true as const,
      assignedTo: growerUserId,
      growerName: `${grower.firstName} ${grower.lastName}`.trim(),
      rowCount: ids.length,
      rootSerial: root.serial,
    };
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
        passportUrl = `${base}/passport/${encodeURIComponent(publicBatchId)}?badge=${encodeURIComponent(row.serial)}`;
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
