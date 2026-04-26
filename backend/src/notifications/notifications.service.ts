import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationTrigger, UserRole } from '@prisma/client';

/**
 * Enhanced Notifications Service
 * Smart notification engine with triggers and templates
 */
@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.notifications.create({
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

    return this.prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: this.mapTriggerToType(trigger),
        title,
        message,
        actionUrl: template.actionUrl,
        status: 'UNREAD',
      },
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

    return this.prisma.notifications.create({
      data: {
        id: crypto.randomUUID(),
        userId,
        type: 'SYSTEM',
        title: notification.title,
        message: notification.message,
        status: 'UNREAD',
      },
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
