import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { ReconcileRefundDto } from './dto/reconcile-refund.dto';

// Existing wallet/payment columns are Float. Accept only whole cents, allowing tiny
// binary floating-point round-off from earlier atomic wallet increments.
function cents(value: number): number {
  const exact = new Prisma.Decimal(value).mul(100), rounded = exact.round();
  if (!exact.isFinite() || exact.minus(rounded).abs().gt('0.000001') || rounded.abs().gt(2_147_483_647)) {
    throw new BadRequestException('Historical amounts need a finance review before reconciliation');
  }
  return rounded.toNumber();
}
const person = { id: true, firstName: true, lastName: true } as const;
const savedInclude = { entries: { orderBy: { sourceKey: 'asc' as const }, include: {
  credit: { select: { wallets: { select: { users: { select: person } } } } },
} } } as const;

@Injectable()
export class RefundReconciliationService {
  constructor(private db: PrismaService) {}

  private async sources(tx: Prisma.TransactionClient, refund: { deliveryId: string; amountCents: number }, payment: { orderId: string; farmerAmount: number; driverAmount: number; platformFee: number }) {
    const credits = await tx.wallet_transactions.findMany({
      where: { orderId: payment.orderId, deliveryId: refund.deliveryId, status: 'COMPLETED', type: { in: ['EARNED', 'PLATFORM_FEE'] }, amount: { gt: 0 } },
      include: { wallets: { select: { id: true, userId: true, availableBalance: true, users: { select: person } } } }, orderBy: { id: 'asc' },
    });
    let earned = 0, fee = 0;
    const rows = credits.map((credit) => {
      const amountCents = cents(credit.amount);
      if (amountCents <= 0) throw new BadRequestException('Original wallet credit must be positive');
      if (credit.type === 'PLATFORM_FEE') fee += amountCents; else earned += amountCents;
      return { sourceKey: credit.id, creditId: credit.id as string | null, walletId: credit.walletId as string | null,
        recipient: credit.wallets.users as { id: string; firstName: string; lastName: string } | null,
        kind: credit.type as string, amountCents, availableCents: cents(credit.wallets.availableBalance) as number | null };
    });
    const expectedFee = cents(payment.platformFee);
    if (earned !== cents(payment.farmerAmount) + cents(payment.driverAmount) || (fee !== 0 && fee !== expectedFee) || earned + expectedFee !== refund.amountCents) {
      throw new BadRequestException('Original credits do not match the payment split. Finance review is required; no balances were changed.');
    }
    // Deployments without PLATFORM_WALLET_USER_ID retain this share outside a wallet.
    if (fee === 0 && expectedFee > 0) rows.push({ sourceKey: 'uncredited-platform-fee', creditId: null, walletId: null,
      recipient: null, kind: 'UNCREDITED_PLATFORM_FEE', amountCents: expectedFee, availableCents: null });
    return rows;
  }

  async details(id: string) {
    const refund = await this.db.delivery_refunds.findUnique({ where: { id }, include: { payment: true, reconciliation: { include: savedInclude } } });
    if (!refund) throw new NotFoundException('Refund not found');
    if (refund.status !== 'CONFIRMED' || refund.originalPaymentStatus !== 'RELEASED') throw new BadRequestException('Reconciliation requires a recorded bank refund of an already distributed payment');
    return { refundId: id, revision: refund.revision, amountCents: refund.amountCents, currency: refund.currency,
      reconciliation: refund.reconciliation,
      sources: refund.reconciliation ? [] : await this.sources(this.db, refund, refund.payment) };
  }

  async reconcile(actor: string, id: string, dto: ReconcileRefundDto) {
    const entries = [...dto.entries].sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
    if (new Set(entries.map(e => e.sourceKey)).size !== entries.length) throw new BadRequestException('Each original credit must occur exactly once');
    const requestHash = createHash('sha256').update(JSON.stringify({ amountCents: dto.amountCents, currency: dto.currency,
      reason: dto.reason.trim(), entries: entries.map(e => ({ sourceKey: e.sourceKey, amountCents: e.amountCents, method: e.method })) })).digest('hex');
    try {
      return await this.db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM delivery_refunds WHERE id = ${id} FOR UPDATE`;
        const refund = await tx.delivery_refunds.findUnique({ where: { id }, include: { reconciliation: { include: savedInclude }, payment: true } });
        if (!refund) throw new NotFoundException('Refund not found');
        if (refund.reconciliation) {
          if (refund.reconciliation.requestHash !== requestHash) throw new ConflictException('A different reconciliation is already recorded. Refresh to view the saved decision.');
          return refund.reconciliation;
        }
        if (refund.status !== 'CONFIRMED' || refund.originalPaymentStatus !== 'RELEASED' || !refund.reconciliationRequired || refund.payment.status !== 'REFUNDED') {
          throw new BadRequestException('Reconciliation requires a recorded bank refund of an already distributed payment');
        }
        if (refund.revision !== dto.revision) throw new ConflictException('Refund changed. Refresh before reconciliation.');
        if (dto.amountCents !== refund.amountCents || dto.currency !== refund.currency) throw new BadRequestException('Amount and currency must match the full refund');
        const sources = await this.sources(tx, refund, refund.payment);
        if (entries.length !== sources.length) throw new BadRequestException('Choose how to settle every original payment share');
        for (const entry of entries) {
          const source = sources.find(s => s.sourceKey === entry.sourceKey);
          if (!source || source.amountCents !== entry.amountCents) throw new BadRequestException('Original credit or amount changed. Refresh the reconciliation.');
          if (entry.method === 'WALLET_RECOVERY' && !source.walletId) throw new BadRequestException('An uncredited platform share cannot be recovered from a wallet');
        }
        const recoveredCents = entries.filter(e => e.method === 'WALLET_RECOVERY').reduce((sum, e) => sum + e.amountCents, 0);
        // Lock in stable order and aggregate by wallet: one user can receive multiple shares.
        const debits = new Map<string, number>();
        for (const entry of entries.filter(e => e.method === 'WALLET_RECOVERY')) {
          const source = sources.find(s => s.sourceKey === entry.sourceKey)!;
          debits.set(source.walletId!, (debits.get(source.walletId!) || 0) + entry.amountCents);
        }
        for (const walletId of [...debits.keys()].sort()) {
          await tx.$queryRaw`SELECT id FROM wallets WHERE id = ${walletId} FOR UPDATE`;
          const wallet = await tx.wallets.findUniqueOrThrow({ where: { id: walletId } });
          const available = cents(wallet.availableBalance), debit = debits.get(walletId)!;
          if (available < debit) throw new ConflictException('Insufficient available wallet balance. No part of this reconciliation was saved.');
          await tx.wallets.update({ where: { id: walletId }, data: { availableBalance: (available - debit) / 100, updatedAt: new Date() } });
        }
        const reconciliation = await tx.refund_reconciliations.create({ data: { refundId: id, amountCents: refund.amountCents, currency: refund.currency,
          recoveredCents, platformCostCents: refund.amountCents - recoveredCents, reason: dto.reason.trim(), createdBy: actor, requestHash } });
        for (const entry of entries) {
          const source = sources.find(s => s.sourceKey === entry.sourceKey)!;
          let debitId: string | null = null;
          if (entry.method === 'WALLET_RECOVERY') {
            debitId = randomUUID();
            await tx.wallet_transactions.create({ data: { id: debitId, walletId: source.walletId!, type: 'REFUNDED', amount: -entry.amountCents / 100,
              status: 'COMPLETED', orderId: refund.payment.orderId, deliveryId: refund.deliveryId, completedAt: new Date(),
              description: `Refund recovery ${id}: reversal of credit ${source.creditId}` } });
          }
          await tx.refund_reconciliation_entries.create({ data: { reconciliationId: reconciliation.id, sourceKey: source.sourceKey,
            creditId: source.creditId, debitId, recipientUserId: source.recipient?.id ?? null, amountCents: entry.amountCents, method: entry.method } });
        }
        await tx.delivery_refunds.update({ where: { id }, data: { reconciliationRequired: false, revision: { increment: 1 } } });
        await tx.audit_trails.create({ data: { id: randomUUID(), eventType: 'STATUS_CHANGE', entityType: 'ReturnRefund', entityId: id,
          performedByUserId: actor, newValue: { action: 'REFUND_RECONCILED', reconciliationId: reconciliation.id, recoveredCents,
            platformCostCents: reconciliation.platformCostCents, currency: refund.currency } } });
        return tx.refund_reconciliations.findUniqueOrThrow({ where: { id: reconciliation.id }, include: savedInclude });
      });
    } catch (e) {
      if (e?.code === 'P2002') throw new ConflictException('An original wallet credit was already reconciled. No balances were changed.');
      throw e;
    }
  }
}
