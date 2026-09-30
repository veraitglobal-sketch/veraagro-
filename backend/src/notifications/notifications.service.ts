import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationTrigger, UserRole } from '@prisma/client';
import { PushNotificationService } from './push-notification.service';

/**
 * Enhanced Notifications Service
 * Smart notification engine with triggers and templates
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Create notification (basic)
   */
  async create(data: {
    userId: string;
    type: 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM';
    title: string;
    message: string;
    actionUrl?: string;
  }) {
    const row = await this.prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        status: 'UNREAD',
      },
    });

    void this.pushNotificationService
      .sendToUser(data.userId, {
        title: data.title,
        body: data.message,
        actionUrl: data.actionUrl,
        notificationId: row.id,
        type: data.type,
      })
      .catch((e) => {
        this.logger.warn(`push after create failed user=${data.userId}: ${e instanceof Error ? e.message : e}`);
      });

    return row;
  }

  /**
   * In-app alert for all SUPER_ADMIN / ADMIN users (admin panel bell feed).
   */
  async notifyAdminsForNewBuyerRegistration(data: {
    buyerLabel: string;
    email: string;
  }): Promise<void> {
    const title = 'New buyer registration';
    const message = `${data.buyerLabel} (${data.email}) — approve in Users`;

    const admins = await this.prisma.users.findMany({
      where: {
        OR: [{ roles: { has: 'SUPER_ADMIN' } }, { roles: { has: 'ADMIN' } }],
      },
      select: { id: true },
    });

    for (const a of admins) {
      try {
        await this.create({
          userId: a.id,
          type: 'ACTION_REQUIRED',
          title,
          message,
          actionUrl: '/admin/users?status=PENDING_VERIFICATION',
        });
      } catch (e) {
        this.logger.warn(`notifyAdminsForNewBuyerRegistration: failed for user ${a.id}`, e);
      }
    }
  }

  async notifyBuyerAccountApproved(data: {
    buyerId: string;
    firstName: string;
    email?: string | null;
  }): Promise<void> {
    await this.create({
      userId: data.buyerId,
      type: 'SYSTEM',
      title: 'Buyer account active',
      message: 'Your Bio Vera buyer account is active — you can now order from the Marketplace.',
      actionUrl: '/buyer-portal/marketplace',
    });
  }

  async notifyAdminsForNewOrder(data: {
    orderNumber: string;
    productName: string;
    totalAmount: number | null;
    buyerLabel: string;
    estateLabel: string;
    isPreOrder?: boolean;
    isCatalogOrder?: boolean;
  }): Promise<void> {
    const title = data.isPreOrder
      ? 'New pre-order'
      : data.isCatalogOrder
        ? 'New marketplace order'
        : 'New order';
    const amt =
      data.totalAmount != null ? `€${data.totalAmount.toFixed(2)}` : '—';
    const message = data.isCatalogOrder
      ? `${data.orderNumber}: ${data.productName}`
      : `${data.orderNumber} — ${data.productName} — ${data.buyerLabel} · ${amt} · ${data.estateLabel}`;

    const admins = await this.prisma.users.findMany({
      where: {
        OR: [
          { roles: { has: 'SUPER_ADMIN' } },
          { roles: { has: 'ADMIN' } },
        ],
      },
      select: { id: true },
    });

    for (const a of admins) {
      try {
        await this.create({
          userId: a.id,
          type: 'SYSTEM',
          title,
          message,
          actionUrl: '/admin/orders',
        });
      } catch (e) {
        this.logger.warn(
          `notifyAdminsForNewOrder: failed for user ${a.id}`,
          e,
        );
      }
    }
  }

  /**
   * In-app alert when a grower submits a transport request (mission pending dispatch).
   */
  async notifyAdminsForNewTransportRequest(data: {
    missionNumber: string;
    growerLabel: string;
    destinationCity: string | null;
    missionId: string;
    awaitingApproval?: boolean;
  }): Promise<void> {
    const city = data.destinationCity?.trim() || '—';
    const message = `${data.missionNumber} — ${data.growerLabel} → ${city}`;
    const title = data.awaitingApproval
      ? 'Transport request awaiting approval'
      : 'New transport request';
    const actionUrl = data.awaitingApproval
      ? `/admin/grower-control?tab=transport&missionId=${encodeURIComponent(data.missionId)}`
      : '/admin/missions';

    const admins = await this.prisma.users.findMany({
      where: {
        OR: [
          { roles: { has: 'SUPER_ADMIN' } },
          { roles: { has: 'ADMIN' } },
        ],
      },
      select: { id: true },
    });

    for (const a of admins) {
      try {
        await this.create({
          userId: a.id,
          type: 'ACTION_REQUIRED',
          title,
          message,
          actionUrl,
        });
      } catch (e) {
        this.logger.warn(
          `notifyAdminsForNewTransportRequest: failed for user ${a.id}`,
          e,
        );
      }
    }
  }

  async notifyGrowerTransportDecision(data: {
    growerId: string;
    missionNumber: string;
    approved: boolean;
    reason?: string;
    missionId: string;
  }): Promise<void> {
    const title = data.approved ? 'Transport approved' : 'Transport rejected';
    const message = data.approved
      ? `${data.missionNumber}: operations approved the request. A carrier can now be assigned.`
      : `${data.missionNumber}: the request was not approved.${data.reason?.trim() ? ` Reason: ${data.reason.trim()}` : ''}`;
    await this.create({
      userId: data.growerId,
      type: data.approved ? 'SYSTEM' : 'ALERT',
      title,
      message,
      actionUrl: `/(producer)/mission/${encodeURIComponent(data.missionId)}`,
    });
  }

  async notifyGrowerGrowthPhotoRejected(data: {
    growerId: string;
    reason?: string;
    parcelLabel?: string;
  }): Promise<void> {
    await this.create({
      userId: data.growerId,
      type: 'ALERT',
      title: 'Growth photo rejected',
      message: `${data.parcelLabel ? `${data.parcelLabel}: ` : ''}Operations did not accept the photo.${data.reason?.trim() ? ` ${data.reason.trim()}` : ''} Please send a new one from the plot.`,
      actionUrl: '/(producer)/growth-journal',
    });
  }

  async notifyGrowerPlantingRemoved(data: {
    growerId: string;
    cropType: string;
    reason?: string;
  }): Promise<void> {
    await this.create({
      userId: data.growerId,
      type: 'ALERT',
      title: 'Planting removed',
      message: `Planting plan "${data.cropType}" was removed.${data.reason?.trim() ? ` ${data.reason.trim()}` : ''}`,
      actionUrl: '/(producer)/plantings',
    });
  }

  async notifyAdminsNewGrowthPhoto(data: {
    growerLabel: string;
    parcelLabel: string;
    logId: string;
  }): Promise<void> {
    const admins = await this.prisma.users.findMany({
      where: { OR: [{ roles: { has: 'SUPER_ADMIN' } }, { roles: { has: 'ADMIN' } }] },
      select: { id: true },
    });
    for (const a of admins) {
      try {
        await this.create({
          userId: a.id,
          type: 'ACTION_REQUIRED',
          title: 'Nova fotografija rasta',
          message: `${data.growerLabel} — ${data.parcelLabel}`,
          actionUrl: `/admin/grower-control?tab=growth&logId=${encodeURIComponent(data.logId)}`,
        });
      } catch (e) {
        this.logger.warn(`notifyAdminsNewGrowthPhoto: ${a.id}`, e);
      }
    }
  }

  /**
   * Send smart notification based on trigger
   */
  async sendSmartNotification(
    trigger: NotificationTrigger,
    userId: string,
    context: any,
  ) {
    // Get user to determine role
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    // Get template for this trigger and role
    const template = await this.prisma.notification_templates.findFirst({
      where: {
        trigger,
        userRole: user.roles[0] || 'GROWER',
      },
    });

    if (!template) {
      // Fallback to default message
      return this.createDefaultNotification(trigger, userId, context);
    }

    // Replace placeholders in message
    let message = template.message;
    let title = template.title;

    // Replace context variables
    Object.keys(context).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      message = message.replace(regex, context[key]);
      title = title.replace(regex, context[key]);
    });

    return this.create({
      userId,
      type: this.mapTriggerToType(trigger),
      title,
      message,
      actionUrl: template.actionUrl ?? undefined,
    });
  }

  /**
   * Notify farmer: "Kombi stiže za 20 min"
   */
  async notifyFarmerDriverArrival(farmerId: string, driverName: string, minutes: number) {
    return this.sendSmartNotification(
      NotificationTrigger.DRIVER_NEARBY,
      farmerId,
      {
        driverName,
        minutes: minutes.toString(),
      },
    );
  }

  /**
   * Notify driver: "Nova tura u tvojoj blizini"
   */
  async notifyDriverNewDelivery(driverId: string, orderNumber: string, distance: string) {
    return this.sendSmartNotification(
      NotificationTrigger.DELIVERY_ASSIGNED,
      driverId,
      {
        orderNumber,
        distance,
      },
    );
  }

  /**
   * Notify buyer: "Tvoj Bio paket je spakovan"
   */
  async notifyBuyerPackageReady(buyerId: string, orderNumber: string) {
    return this.sendSmartNotification(
      NotificationTrigger.PACKAGE_READY,
      buyerId,
      {
        orderNumber,
      },
    );
  }

  /**
   * Notify payment released
   */
  async notifyPaymentReleased(userId: string, amount: number, orderNumber: string) {
    return this.sendSmartNotification(
      NotificationTrigger.PAYMENT_RELEASED,
      userId,
      {
        amount: amount.toString(),
        orderNumber,
      },
    );
  }

  /**
   * Notify quality issue (batch tracking)
   */
  async notifyQualityIssue(
    batchId: string,
    reportedBy: string,
    issue: string,
    affectedUsers: string[],
  ) {
    // Notify all affected parties
    for (const userId of affectedUsers) {
      await this.sendSmartNotification(
        NotificationTrigger.QUALITY_ISSUE,
        userId,
        {
          batchId,
          reportedBy,
          issue,
        },
      );
    }
  }

  /**
   * Default notification if template not found
   */
  private async createDefaultNotification(
    trigger: NotificationTrigger,
    userId: string,
    context: any,
  ) {
    const messages: Record<NotificationTrigger, { title: string; message: string }> = {
      DELIVERY_ASSIGNED: {
        title: 'New delivery',
        message: `New tour assigned: ${context.orderNumber || 'N/A'}`,
      },
      DRIVER_NEARBY: {
        title: 'Driver arriving',
        message: `Driver ${context.driverName || ''} arriving in ${context.minutes || ''} minutes`,
      },
      PACKAGE_READY: {
        title: 'Package ready',
        message: `Your Bio package for order ${context.orderNumber || ''} is packed`,
      },
      PAYMENT_RELEASED: {
        title: 'Payment released',
        message: `Payment of ${context.amount || ''} EUR has been released`,
      },
      QUALITY_ISSUE: {
        title: 'Quality issue',
        message: `Quality issue reported for batch ${context.batchId || ''}: ${context.issue || ''}`,
      },
      BATCH_ARRIVED: {
        title: 'Batch arrived',
        message: `Batch ${context.batchId || ''} has arrived at hub`,
      },
      CUSTOM: {
        title: context.title || 'Notification',
        message: context.message || '',
      },
    };

    const notification = messages[trigger] || messages.CUSTOM;

    return this.create({
      userId,
      type: 'SYSTEM',
      title: notification.title,
      message: notification.message,
    });
  }

  private mapTriggerToType(trigger: NotificationTrigger) {
    const mapping: Record<NotificationTrigger, 'ACTION_REQUIRED' | 'REMINDER' | 'ALERT' | 'SYSTEM'> = {
      DELIVERY_ASSIGNED: 'ACTION_REQUIRED',
      DRIVER_NEARBY: 'REMINDER',
      PACKAGE_READY: 'SYSTEM',
      PAYMENT_RELEASED: 'SYSTEM',
      QUALITY_ISSUE: 'ALERT',
      BATCH_ARRIVED: 'SYSTEM',
      CUSTOM: 'SYSTEM',
    };
    return mapping[trigger] || 'SYSTEM';
  }

  /** True when the same text already reached this user recently (avoids double status pings). */
  async hasRecentDuplicate(userId: string, title: string, message: string, withinMinutes = 30) {
    const since = new Date(Date.now() - withinMinutes * 60_000);
    const row = await this.prisma.notifications.findFirst({
      where: { userId, title, message, createdAt: { gte: since } },
      select: { id: true },
    });
    return row != null;
  }

  async findAllByUser(userId: string) {
    return this.prisma.notifications.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notifications.updateMany({
      where: {
        userId,
        status: 'UNREAD',
      },
      data: {
        status: 'READ',
        readAt: new Date(),
      },
    });
  }
}
