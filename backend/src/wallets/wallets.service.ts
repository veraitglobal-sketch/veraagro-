import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, WalletTransactionType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get or create wallet for user
   */
  async getWallet(userId: string) {
    const include = { wallet_transactions: { orderBy: { createdAt: 'desc' as const }, take: 20 } };
    const existing = await this.prisma.wallets.findUnique({ where: { userId }, include });
    if (existing) return existing;
    await this.prisma.wallets.createMany({ data: [{ id: crypto.randomUUID(), userId, availableBalance: 0,
      pendingBalance: 0, totalEarned: 0, updatedAt: new Date() }], skipDuplicates: true });
    return this.prisma.wallets.findUniqueOrThrow({ where: { userId }, include });
  }

  /**
   * Credit wallet (add money)
   */
  async creditWallet(
    userId: string,
    amount: number,
    type: WalletTransactionType,
    orderId?: string,
    deliveryId?: string,
    description?: string,
  ) {
    return this.prisma.$transaction((tx) => this.creditWalletTx(tx, userId, amount, type, orderId, deliveryId, description));
  }

  /**
   * Credit wallet inside an interactive transaction (e.g. escrow release).
   */
  async creditWalletTx(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    type: WalletTransactionType,
    orderId?: string,
    deliveryId?: string,
    description?: string,
  ) {
    if (!Number.isFinite(amount) || amount < 0 || !new Prisma.Decimal(amount).mul(100).isInteger()) throw new BadRequestException('Credit must be a non-negative amount in whole cents');
    // Atomic upsert/increment avoids lost credits across different orders and
    // handles concurrent first payments when the recipient has no wallet yet.
    const wallet = await tx.wallets.upsert({
      where: { userId },
      create: {
        id: crypto.randomUUID(), userId, availableBalance: amount,
        pendingBalance: 0, totalEarned: amount, updatedAt: new Date(),
      },
      update: {
        availableBalance: { increment: amount },
        totalEarned: { increment: amount },
        updatedAt: new Date(),
      },
    });

    return tx.wallet_transactions.create({
      data: {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        type,
        amount,
        status: 'COMPLETED',
        orderId,
        deliveryId,
        description: description || `Payment for ${type}`,
        completedAt: new Date(),
      },
    });


  }

  /**
   * Debit wallet (withdraw money)
   */
  async debitWallet(userId: string, amount: number, description: string) {
    if (!Number.isFinite(amount) || amount <= 0 || !new Prisma.Decimal(amount).mul(100).isInteger()) {
      throw new BadRequestException('Withdrawal must be positive and expressed in whole cents');
    }
    return this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallets.findUnique({ where: { userId } });
      if (!wallet) throw new BadRequestException('Insufficient balance');
      // Atomic conditional decrement shares the row lock with refund reconciliation.
      const changed = await tx.wallets.updateMany({ where: { id: wallet.id, availableBalance: { gte: amount } },
        data: { availableBalance: { decrement: amount }, updatedAt: new Date() } });
      if (changed.count !== 1) throw new BadRequestException('Insufficient balance');
      return tx.wallet_transactions.create({ data: { id: crypto.randomUUID(), walletId: wallet.id, type: 'WITHDRAWN',
        amount: -amount, status: 'PENDING', description } });
    });
  }

  /**
   * Get wallet transactions
   */
  async getTransactions(userId: string) {
    const wallet = await this.getWallet(userId);

    return this.prisma.wallet_transactions.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
    });
  }
}
