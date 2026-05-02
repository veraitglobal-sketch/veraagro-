import { Injectable, NotFoundException } from '@nestjs/common';
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
    let wallet = await this.prisma.wallets.findUnique({
      where: { userId },
      include: {
        wallet_transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      const newWallet = await this.prisma.wallets.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          updatedAt: new Date(),
        },
      });
      
      wallet = await this.prisma.wallets.findUnique({
        where: { userId },
        include: {
          wallet_transactions: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    }

    return wallet;
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
    const wallet = await this.getWallet(userId);

    const transaction = await this.prisma.wallet_transactions.create({
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

    // Update wallet balance
    await this.prisma.wallets.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance + amount,
        totalEarned: wallet.totalEarned + amount,
      },
    });

    return transaction;
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
    let wallet = await tx.wallets.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallets.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          updatedAt: new Date(),
        },
      });
    }

    await tx.wallet_transactions.create({
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

    await tx.wallets.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance + amount,
        totalEarned: wallet.totalEarned + amount,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Debit wallet (withdraw money)
   */
  async debitWallet(userId: string, amount: number, description: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }

    const transaction = await this.prisma.wallet_transactions.create({
      data: {
        id: crypto.randomUUID(),
        walletId: wallet.id,
        type: 'WITHDRAWN',
        amount: -amount,
        status: 'PENDING',
        description,
      },
    });

    // Update wallet balance
    await this.prisma.wallets.update({
      where: { id: wallet.id },
      data: {
        availableBalance: wallet.availableBalance - amount,
      },
    });

    return transaction;
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
