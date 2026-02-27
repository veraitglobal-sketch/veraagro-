import { Injectable, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { BlockchainService } from '../blockchain/blockchain.service';
import { BatchStatus } from '@prisma/client';

/**
 * Batch Tracking Service
 * Tracks every box/crate with Batch_ID
 * One-click traceability: Who harvested, who drove, which hub
 */
@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => NotificationsGateway))
    private notificationsGateway: NotificationsGateway,
    private blockchainService: BlockchainService,
  ) {}

  /**
   * Create new batch (when farmer packs produce)
   */
  async createBatch(data: {
    estateId: string;
    parcelId?: string;
    harvestedByUserId: string;
    productName: string;
    quantity: number;
    unit: string;
    harvestDate: Date;
  }) {
    // Generate batch ID
    const batchId = `BATCH-${new Date().getFullYear()}-${String(
      Math.floor(Math.random() * 10000),
    ).padStart(4, '0')}`;

    const batch = await this.prisma.batches.create({
      data: {
        batchId,
        estateId: data.estateId,
        parcelId: data.parcelId,
        harvestedByUserId: data.harvestedByUserId,
        productName: data.productName,
        quantity: data.quantity,
        unit: data.unit,
        harvestDate: data.harvestDate,
        status: 'PACKED',
        locationHistory: [
          {
            hubId: null,
            timestamp: new Date().toISOString(),
            status: 'PACKED',
            driverId: null,
          },
        ],
      } as any,
    });

    // Register on blockchain if enabled (non-blocking; batch is already created)
    if (this.blockchainService.isEnabled()) {
      try {
        const harvestDateStr =
          data.harvestDate instanceof Date
            ? data.harvestDate.toISOString().split('T')[0]
            : new Date(data.harvestDate).toISOString().split('T')[0];
        const result = await this.blockchainService.registerBatch({
          batchId,
          estateId: data.estateId,
          harvestDate: harvestDateStr,
          productType: data.productName,
        });
        await this.prisma.batches.update({
          where: { id: batch.id },
          data: {
            blockchainTxHash: result.txHash,
            blockchainRegisteredAt: result.timestamp,
            updatedAt: new Date(),
          },
        });
        this.logger.log(`Batch ${batchId} registered on blockchain: ${result.txHash}`);
        const updated = await this.prisma.batches.findUnique({ where: { id: batch.id } });
        if (updated) return updated;
      } catch (err) {
        this.logger.warn(`Blockchain register failed for batch ${batchId}`, err);
      }
    }

    return batch;
  }

  /**
   * Move batch to hub
   */
  async moveToHub(batchId: string, hubId: string, driverId?: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Update location history
    const locationHistory = (batch.locationHistory as any[]) || [];
    locationHistory.push({
      hubId,
      timestamp: new Date().toISOString(),
      status: 'IN_HUB',
      driverId: driverId || null,
    });

    const updated = await this.prisma.batches.update({
      where: { batchId },
      data: {
        currentHubId: hubId,
        status: 'IN_HUB',
        transportedByDriverId: driverId || batch.transportedByDriverId,
        locationHistory,
      },
    });

    // Notify hub manager
    const hub = await this.prisma.hubs.findUnique({
      where: { id: hubId },
      include: { users: true },
    });

    if (hub?.users) {
      await this.notificationsService.sendSmartNotification(
        'BATCH_ARRIVED' as any,
        hub.users.id,
        { batchId },
      );
    }

    // Real-time notification to producer (grower)
    if (updated.harvestedByUserId) {
      const hubName = hub?.name || 'Hub';
      await this.notificationsGateway.notifyBatchLocationUpdate(
        updated.harvestedByUserId,
        updated,
        hubName,
      );
    }

    return updated;
  }

  /**
   * Assign batch to order
   */
  async assignToOrder(batchId: string, orderItemId: string) {
    // Note: Batch can have multiple orderItems, so we link via OrderItem instead
    return this.prisma.batches.update({
      where: { batchId },
      data: {
        status: 'IN_TRANSIT',
      },
    });
  }

  /**
   * Mark batch as delivered
   */
  async markDelivered(batchId: string) {
    return this.prisma.batches.update({
      where: { batchId },
      data: {
        status: 'DELIVERED',
      },
    });
  }

  /**
   * Report quality issue
   * One-click traceability: See who harvested, who drove, which hub
   */
  async reportQualityIssue(
    batchId: string,
    reportedByUserId: string,
    issue: string,
  ) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        estates: { include: { users: true } },
        users_batches_harvestedByUserIdTousers: true,
        users_batches_transportedByDriverIdTousers: true,
        hubs: { include: { users: true } },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Record quality issue
    const qualityIssues = (batch.qualityIssues as any[]) || [];
    qualityIssues.push({
      reportedBy: reportedByUserId,
      issue,
      timestamp: new Date().toISOString(),
    });

    await this.prisma.batches.update({
      where: { batchId },
      data: {
        qualityIssues,
      },
    });

    // Notify all involved parties
    const affectedUsers: string[] = [];

    if (batch.estates.ownerId) {
      affectedUsers.push(batch.estates.ownerId);
    }
    if (batch.users_batches_harvestedByUserIdTousers) {
      affectedUsers.push(batch.users_batches_harvestedByUserIdTousers.id);
    }
    if (batch.users_batches_transportedByDriverIdTousers) {
      affectedUsers.push(batch.users_batches_transportedByDriverIdTousers.id);
    }
    if (batch.hubs?.managerId) {
      affectedUsers.push(batch.hubs.managerId);
    }

    await this.notificationsService.notifyQualityIssue(
      batchId,
      reportedByUserId,
      issue,
      affectedUsers,
    );

    // Return traceability info
    return {
      batch: {
        batchId: batch.batchId,
        productName: batch.productName,
        harvestDate: batch.harvestDate,
      },
      traceability: {
        harvestedBy: batch.users_batches_harvestedByUserIdTousers
          ? {
              id: batch.users_batches_harvestedByUserIdTousers.id,
              name: `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`,
            }
          : null,
        transportedBy: batch.users_batches_transportedByDriverIdTousers
          ? {
              id: batch.users_batches_transportedByDriverIdTousers.id,
              name: `${batch.users_batches_transportedByDriverIdTousers.firstName} ${batch.users_batches_transportedByDriverIdTousers.lastName}`,
            }
          : null,
        currentHub: batch.hubs
          ? {
              id: batch.hubs.id,
              name: batch.hubs.name,
              city: batch.hubs.city,
            }
          : null,
        locationHistory: batch.locationHistory,
      },
      qualityIssues,
    };
  }

  /**
   * Get batch traceability (one-click view)
   */
  async getBatchTraceability(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        estates: { include: { users: true } },
        parcels: true,
        users_batches_harvestedByUserIdTousers: true,
        users_batches_transportedByDriverIdTousers: true,
        hubs: true,
        order_items: {
          include: {
            orders: {
              include: {
                users: true,
                deliveries: { include: { users: true } },
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return {
      batch: {
        batchId: batch.batchId,
        productName: batch.productName,
        quantity: batch.quantity,
        unit: batch.unit,
        harvestDate: batch.harvestDate,
        status: batch.status,
      },
      traceability: {
        origin: {
          estate: {
            id: batch.estates.id,
            name: batch.estates.name,
            owner: {
              id: batch.estates.users.id,
              name: `${batch.estates.users.firstName} ${batch.estates.users.lastName}`,
            },
          },
          parcel: batch.parcels
            ? {
                id: batch.parcels.id,
                cropType: batch.parcels.cropType,
              }
            : null,
        },
        harvestedBy: batch.users_batches_harvestedByUserIdTousers
          ? {
              id: batch.users_batches_harvestedByUserIdTousers.id,
              name: `${batch.users_batches_harvestedByUserIdTousers.firstName} ${batch.users_batches_harvestedByUserIdTousers.lastName}`,
            }
          : null,
        transportedBy: batch.users_batches_transportedByDriverIdTousers
          ? {
              id: batch.users_batches_transportedByDriverIdTousers.id,
              name: `${batch.users_batches_transportedByDriverIdTousers.firstName} ${batch.users_batches_transportedByDriverIdTousers.lastName}`,
            }
          : null,
        currentLocation: batch.hubs
          ? {
              hubId: batch.hubs.id,
              hubName: batch.hubs.name,
              city: batch.hubs.city,
            }
          : 'At origin (estate)',
        locationHistory: batch.locationHistory,
        orders: batch.order_items && batch.order_items.length > 0
          ? batch.order_items.map((item) => ({
              orderId: item.orders.id,
              orderNumber: item.orders.orderNumber,
              buyer: {
                id: item.orders.users.id,
                name: `${item.orders.users.firstName} ${item.orders.users.lastName}`,
              },
              delivery: item.orders.deliveries
                ? {
                    driver: item.orders.deliveries.users
                      ? {
                          id: item.orders.deliveries.users.id,
                          name: `${item.orders.deliveries.users.firstName} ${item.orders.deliveries.users.lastName}`,
                        }
                      : null,
                  }
                : null,
            }))
          : [],
        qualityIssues: batch.qualityIssues,
      },
    };
  }

  /**
   * Get batch availability (for reservations)
   * Returns total quantity, reserved quantity, and available quantity
   */
  async getBatchAvailability(batchId: string) {
    const batch = await this.prisma.batches.findUnique({
      where: { batchId },
      include: {
        order_items: {
          where: {
            orders: {
              status: {
                notIn: ['CANCELLED', 'REFUNDED'],
              },
            },
          },
          include: {
            orders: {
              include: {
                users: true,
              },
            },
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    // Calculate reserved quantity from order items
    const reservedQuantity = batch.order_items.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);

    const totalQuantity = batch.quantity;
    const availableQuantity = totalQuantity - reservedQuantity;
    const reservedPercentage = totalQuantity > 0 ? (reservedQuantity / totalQuantity) * 100 : 0;

    return {
      batchId: batch.batchId,
      productName: batch.productName,
      totalQuantity,
      reservedQuantity,
      availableQuantity,
      reservedPercentage,
      unit: batch.unit,
      isSoldOut: availableQuantity <= 0,
    };
  }

  /**
   * Get all batches for a user (grower)
   */
  async getAllBatchesForUser(userId: string) {
    return this.prisma.batches.findMany({
      where: {
        harvestedByUserId: userId,
      },
      include: {
        estates: true,
        parcels: true,
        hubs: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
