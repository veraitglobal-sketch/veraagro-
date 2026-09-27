import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { shouldLogThrottled } from '../common/utils/log-throttle';

/** Grower-facing mission status labels (backend notifications are Serbian, like the rest of the feed). */
const MISSION_STATUS_SR: Record<string, string> = {
  AWAITING_APPROVAL: 'zahtev čeka odobrenje operative',
  PENDING: 'odobreno, čeka prevoznika',
  ASSIGNED: 'prevoznik dodeljen',
  ACCEPTED: 'prevoznik prihvatio',
  READY_FOR_LOADING: 'spremno za utovar',
  IN_PROGRESS: 'u toku',
  PICKED_UP: 'roba preuzeta sa farme',
  IN_TRANSIT: 'roba je u transportu',
  COMPLETED: 'isporučeno',
  CANCELLED: 'otkazano',
};

/**
 * Real-time Notifications Gateway
 * Emits live notifications to connected clients
 */
@WebSocketGateway({
  cors: {
    origin: '*', // In production, restrict to specific origins
    credentials: true,
  },
  namespace: '/notifications',
})
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      // Extract token from handshake auth
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        if (shouldLogThrottled('ws:no-token', 30_000)) {
          this.logger.warn('WebSocket client connected without token (disconnecting)');
        }
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = this.jwtService.verify(token);
      const userId = payload.sub || payload.id;

      if (!userId) {
        if (shouldLogThrottled('ws:invalid-token', 30_000)) {
          this.logger.warn('WebSocket client connected with invalid token (disconnecting)');
        }
        client.disconnect();
        return;
      }

      // Store user connection
      this.connectedUsers.set(userId, client.id);
      client.data.userId = userId;

      // Join user-specific room
      client.join(`user:${userId}`);

      // Send pending notifications
      const pendingNotifications = await this.notificationsService.findAllByUser(userId);
      const unread = pendingNotifications.filter(n => !n.readAt);
      if (unread.length > 0) {
        client.emit('notifications', unread);
      }
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.connectedUsers.delete(userId);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    } else if (shouldLogThrottled(`ws:not-connected:${userId}`, 120_000)) {
      this.logger.debug(`User ${userId} not connected; use in-app/push via NotificationsService.create`);
    }
  }

  /**
   * Send notification to multiple users
   */
  async sendNotificationToUsers(userIds: string[], notification: any) {
    userIds.forEach(userId => {
      this.sendNotificationToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastNotification(notification: any) {
    this.server.emit('notification', notification);
  }

  /**
   * Mission status update
   */
  async notifyMissionUpdate(userId: string, mission: any) {
    const ref = mission.missionNumber || String(mission.id).slice(0, 8);
    const status = MISSION_STATUS_SR[mission.status] ?? mission.status;
    const notification = {
      type: 'SYSTEM' as const,
      title: 'Status prevoza',
      message: `${ref}: ${status}`,
      actionUrl: `/grower/portal?missionId=${encodeURIComponent(mission.id)}`,
      missionId: mission.id,
    };

    await this.sendNotificationToUser(userId, notification);

    // Plan + transport request can report the same unchanged status back to back — persist it once.
    if (await this.notificationsService.hasRecentDuplicate(userId, notification.title, notification.message)) {
      return;
    }
    await this.notificationsService.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });
  }

  /**
   * Batch location update (truck arrived at location)
   */
  async notifyBatchLocationUpdate(userId: string, batch: any, location: string) {
    const notification = {
      type: 'ALERT',
      title: 'Batch Location Update',
      message: `Batch ${batch.batchId} is now in ${location}`,
      actionUrl: `/batches/${batch.batchId}`,
      batchId: batch.batchId,
    };

    await this.sendNotificationToUser(userId, notification);
    
    await this.notificationsService.create({
      userId,
      type: 'ALERT',
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });

    this.emitBatchUpdatedToGrower(userId, {
      id: batch.id,
      batchId: batch.batchId,
      status: batch.status,
    });
  }

  /**
   * Push to grower app so Batches list / filters refresh without manual pull (IN_HUB, IN_TRANSIT, …).
   */
  emitBatchUpdatedToGrower(
    userId: string,
    payload: { id: string; batchId: string; status: string },
  ) {
    this.server.to(`user:${userId}`).emit('batch:updated', payload);
  }

  /**
   * Delivery status update
   */
  async notifyDeliveryUpdate(userId: string, delivery: any) {
    const notification = {
      type: 'ALERT',
      title: 'Delivery Update',
      message: `Your delivery #${delivery.id} status: ${delivery.status}`,
      actionUrl: `/deliveries/${delivery.id}`,
      deliveryId: delivery.id,
    };

    await this.sendNotificationToUser(userId, notification);
    
    await this.notificationsService.create({
      userId,
      type: 'ALERT',
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl,
    });
  }
}
