import { dispositionSummarySelect } from './return-disposition.service';
import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { durableImage } from '../common/durable-image';
import { CreateReturnDto, ReturnProofDto, ApproveRefundDto, ConfirmRefundDto } from './dto/return-refund.dto';

const isAdmin = (user: { roles?: string[] }) => user.roles?.some((r) => ['ADMIN', 'SUPER_ADMIN'].includes(r));
export const publicRefundSelect = { id: true, status: true, amountCents: true, currency: true, approvedAt: true, confirmedAt: true, bankPaidAt: true } as const;
export const returnSummarySelect = { id: true, status: true, collectedAt: true, receivedAt: true,
  destinationAddress: true, stockStatus: true, dispositions: { orderBy: { revision: 'desc' }, take: 1, select: dispositionSummarySelect }, refund: { select: publicRefundSelect } } as const;

@Injectable()
export class ReturnsService {
  constructor(private db: PrismaService) {}

  async create(actor: string, dto: CreateReturnDto) {
    return this.db.$transaction(async (tx) => {
      const source = dto.kind === 'issue'
        ? await tx.buyer_delivery_issues.findUnique({ where: { id: dto.sourceId } })
        : await tx.disputes.findUnique({ where: { id: dto.sourceId }, include: { digital_handovers: true } });
      if (!source) throw new NotFoundException('Complaint not found');
      if (source.status !== 'RESOLVED' || source.outcome !== (dto.kind === 'issue' ? 'ACCEPTED' : 'RETURN_REQUIRED')) {
        throw new BadRequestException('Return requires an accepted complaint or return-required decision');
      }
      const deliveryId = 'deliveryId' in source ? source.deliveryId : source.digital_handovers.deliveryId;
      await tx.$queryRaw`SELECT id FROM deliveries WHERE id = ${deliveryId} FOR UPDATE`;
      const existing = await tx.delivery_returns.findUnique({ where: { deliveryId } });
      if (existing) {
        if ((dto.kind === 'issue' ? existing.issueId : existing.disputeId) !== dto.sourceId) throw new ConflictException('Delivery already has a return for another complaint');
        return existing;
      }
      const delivery = await tx.deliveries.findUniqueOrThrow({ where: { id: deliveryId }, include: { orders: { include: { fulfilling_estate: true, estates: true, payments: true } } } });
      const estate = delivery.orders.fulfilling_estate || delivery.orders.estates;
      if (!estate || !['IN_ESCROW', 'RELEASED'].includes(delivery.orders.payments?.status)) throw new BadRequestException('Return requires a paid shipment and known receiving farm');
      const row = await tx.delivery_returns.create({ data: { deliveryId, ...(dto.kind === 'issue' ? { issueId: dto.sourceId } : { disputeId: dto.sourceId }),
        carrierUserId: delivery.driverId, receiverUserId: estate.ownerId, destinationAddress: dto.destinationAddress.trim(),
        instructions: dto.instructions.trim(), createdBy: actor, collectionPhotos: [], receiptPhotos: [] } });
      await this.audit(tx, actor, row.id, 'RETURN_PLANNED', { deliveryId, kind: dto.kind, sourceId: dto.sourceId });
      return row;
    });
  }

  async list(user: { id: string; roles?: string[] }) {
    const admin = isAdmin(user);
    return this.db.delivery_returns.findMany({
      where: admin ? {} : { OR: [{ carrierUserId: user.id }, { receiverUserId: user.id }, { delivery: { orders: { buyerId: user.id } } }] },
      orderBy: { createdAt: 'desc' }, take: 200,
      // Bank proof/reference is deliberately excluded even for the admin list; the evidence endpoint is admin-only.
      select: { id: true, deliveryId: true, status: true, carrierUserId: true, receiverUserId: true, destinationAddress: true,
        instructions: true, revision: true, stockStatus: true, stockRevision: true, dispositions: { orderBy: { revision: 'desc' }, take: 1, select: dispositionSummarySelect }, createdAt: true, collectedAt: true, receivedAt: true,
        collectionNotes: true, receiptNotes: true,
        delivery: { select: { deliveryNumber: true, orders: { select: { orderNumber: true, productName: true, quantity: true, unit: true, totalAmount: true } } } },
        refund: { select: { ...publicRefundSelect, ...(admin ? { revision: true, reconciliationRequired: true, originalPaymentStatus: true, reconciliation: { select: { id: true, recoveredCents: true, platformCostCents: true, createdAt: true } } } : { reconciliation: { select: { createdAt: true, entries: { where: { recipientUserId: user.id }, select: { id: true, amountCents: true, method: true } } } } }) } },
      },
    });
  }

  async evidence(user: { id: string; roles?: string[] }, id: string) {
    const row = await this.db.delivery_returns.findFirst({ where: { id, ...(isAdmin(user) ? {} : {
      OR: [{ carrierUserId: user.id }, { receiverUserId: user.id }, { delivery: { orders: { buyerId: user.id } } }],
    }) }, select: { id: true, collectionPhotos: true, receiptPhotos: true, collectionNotes: true, receiptNotes: true,
      collectedAt: true, receivedAt: true, dispositions: { orderBy: { revision: 'desc' }, select: dispositionSummarySelect } } });
    if (!row) throw new NotFoundException('Return not found');
    return row;
  }

  async dispositionEvidence(user: { id: string; roles?: string[] }, returnId: string, decisionId: string) {
    const row = await this.db.return_dispositions.findFirst({ where: { id: decisionId, returnId,
      ...(isAdmin(user) ? {} : { returnCase: { OR: [{ carrierUserId: user.id }, { receiverUserId: user.id }, { delivery: { orders: { buyerId: user.id } } }] } }) },
      select: { ...dispositionSummarySelect, photos: true } });
    if (!row) throw new NotFoundException('Inspection not found');
    return row;
  }

  async recordProof(user: { id: string; roles?: string[] }, id: string, step: 'collect' | 'receive', dto: ReturnProofDto) {
    const initial = await this.db.delivery_returns.findUnique({ where: { id } });
    if (!initial) throw new NotFoundException('Return not found');
    const allowed = step === 'collect' ? initial.carrierUserId : initial.receiverUserId;
    if (!isAdmin(user) && user.id !== allowed) throw new ForbiddenException('This return action belongs to the assigned carrier or receiving farm');
    const photos = await Promise.all(dto.photos.map((p) => durableImage(p)));
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM delivery_returns WHERE id = ${id} FOR UPDATE`;
      const row = await tx.delivery_returns.findUniqueOrThrow({ where: { id } });
      if (step === 'collect' && ['COLLECTED', 'RECEIVED'].includes(row.status) || step === 'receive' && row.status === 'RECEIVED') return row;
      if (row.revision !== dto.revision) throw new ConflictException('Return changed. Refresh before submitting.');
      if (row.status !== (step === 'collect' ? 'PLANNED' : 'COLLECTED')) throw new BadRequestException('Pickup must be recorded before receiving the return');
      const now = new Date();
      const result = await tx.delivery_returns.update({ where: { id }, data: { revision: { increment: 1 },
        ...(step === 'collect' ? { status: 'COLLECTED', collectedBy: user.id, collectedAt: now, collectionPhotos: photos, collectionNotes: dto.notes.trim() }
          : { status: 'RECEIVED', receivedBy: user.id, receivedAt: now, receiptPhotos: photos, receiptNotes: dto.notes.trim() }) } });
      await this.audit(tx, user.id, id, step === 'collect' ? 'RETURN_COLLECTED' : 'RETURN_RECEIVED', { status: result.status, fullShipment: true });
      return result;
    });
  }

  async approveRefund(actor: string, returnId: string, dto: ApproveRefundDto) {
    return this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM delivery_returns WHERE id = ${returnId} FOR UPDATE`;
      const row = await tx.delivery_returns.findUnique({ where: { id: returnId }, include: { delivery: { include: { orders: { include: { payments: true } } } } } });
      if (!row) throw new NotFoundException('Return not found');
      if (row.status !== 'RECEIVED') throw new BadRequestException('The receiving farm must confirm the complete return before a refund is approved');
      const paymentId = row.delivery.orders.payments?.id;
      if (!paymentId) throw new BadRequestException('Payment not found');
      await tx.$queryRaw`SELECT id FROM payments WHERE id = ${paymentId} FOR UPDATE`;
      const payment = await tx.payments.findUniqueOrThrow({ where: { id: paymentId } });
      const existing = await tx.delivery_refunds.findUnique({ where: { paymentId } });
      if (existing) {
        if (existing.amountCents !== dto.amountCents || existing.currency !== dto.currency) throw new ConflictException('Refund already authorized with a different amount');
        return existing;
      }
      if (!['IN_ESCROW', 'RELEASED'].includes(payment.status)) throw new BadRequestException('Payment cannot be refunded from its current state');
      const cents = new Prisma.Decimal(payment.totalAmount).mul(100);
      if (!cents.isInteger() || !cents.isPositive() || cents.gt(2_147_483_647) || !cents.equals(dto.amountCents)) {
        throw new BadRequestException('Confirm the exact full payment amount in cents');
      }
      const refund = await tx.delivery_refunds.create({ data: { deliveryId: row.deliveryId, paymentId, returnId, amountCents: cents.toNumber(), currency: dto.currency,
        originalPaymentStatus: payment.status, reconciliationRequired: payment.status === 'RELEASED', approvedBy: actor, reason: dto.reason.trim() } });
      await this.audit(tx, actor, refund.id, 'REFUND_APPROVED', { paymentId, amountCents: refund.amountCents, currency: refund.currency, originalPaymentStatus: payment.status });
      return refund;
    });
  }

  async confirmRefund(actor: string, id: string, dto: ConfirmRefundDto) {
    const bankReference = dto.bankReference.trim();
    if (bankReference.length < 5) throw new BadRequestException('Enter the bank transfer reference');
    const evidence = await durableImage(dto.bankEvidence);
    try {
      return await this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM delivery_refunds WHERE id = ${id} FOR UPDATE`;
        const row = await tx.delivery_refunds.findUnique({ where: { id } });
        if (!row) throw new NotFoundException('Refund not found');
        if (row.amountCents !== dto.amountCents || row.currency !== dto.currency) throw new BadRequestException('Bank transfer amount/currency must match the authorized refund');
        if (row.status === 'CONFIRMED') {
          if (row.bankReference !== bankReference || row.bankPaidAt.toISOString() !== new Date(dto.bankPaidAt).toISOString()) throw new ConflictException('A different bank confirmation is already recorded');
          return row;
        }
        if (row.revision !== dto.revision) throw new ConflictException('Refund changed. Refresh before confirming.');
        const paidAt = new Date(dto.bankPaidAt);
        if (paidAt.getTime() < Math.floor(row.approvedAt.getTime() / 60_000) * 60_000 || paidAt.getTime() > Date.now() + 300_000) throw new BadRequestException('Bank transfer time must be after authorization and not in the future');
        await tx.$queryRaw`SELECT id FROM payments WHERE id = ${row.paymentId} FOR UPDATE`;
        const payment = await tx.payments.findUniqueOrThrow({ where: { id: row.paymentId } });
        if (payment.status !== row.originalPaymentStatus) throw new ConflictException('Payment changed after refund authorization');
        const result = await tx.delivery_refunds.update({ where: { id }, data: { status: 'CONFIRMED', confirmedBy: actor, confirmedAt: new Date(),
          bankPaidAt: paidAt, bankReference, bankEvidence: evidence, revision: { increment: 1 } } });
        await tx.payments.update({ where: { id: row.paymentId }, data: { status: 'REFUNDED', updatedAt: new Date() } });
        await tx.orders.update({ where: { id: payment.orderId }, data: { status: 'REFUNDED', updatedAt: new Date() } });
        await this.audit(tx, actor, id, 'BANK_REFUND_RECORDED', { paymentId: row.paymentId, amountCents: row.amountCents, currency: row.currency,
          reconciliationRequired: row.reconciliationRequired });
        return result;
      });
    } catch (e) {
      if (e?.code === 'P2002') throw new ConflictException('This bank reference was already used for another refund');
      throw e;
    }
  }

  async bankEvidence(id: string) {
    const refund = await this.db.delivery_refunds.findUnique({ where: { id }, select: { bankReference: true, bankEvidence: true, bankPaidAt: true, confirmedBy: true } });
    if (!refund) throw new NotFoundException('Refund not found');
    return refund;
  }

  private audit(tx: Prisma.TransactionClient, actor: string, id: string, action: string, data: Record<string, unknown>) {
    return tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'ReturnRefund', entityId: id,
      performedByUserId: actor, newValue: { action, ...data } as Prisma.InputJsonValue } });
  }
}
