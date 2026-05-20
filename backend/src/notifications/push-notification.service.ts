import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import * as admin from 'firebase-admin';
import { PushPlatform } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterPushDto } from './dto/register-push.dto';

export type PushPayload = {
  title: string;
  body: string;
  actionUrl?: string;
  notificationId?: string;
  type?: string;
};

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);
  private firebaseReady = false;

  constructor(private readonly prisma: PrismaService) {
    this.initFirebase();
  }

  private initFirebase(): void {
    if (admin.apps.length > 0) {
      this.firebaseReady = true;
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
    const privateKey = privateKeyRaw?.replace(/\\n/g, '\n').trim();

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.warn(
        'FCM disabled: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY to send push',
      );
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.firebaseReady = true;
      this.logger.log('Firebase Admin initialized for FCM');
    } catch (e) {
      this.logger.error(`Firebase Admin init failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  isEnabled(): boolean {
    return this.firebaseReady;
  }

  async countDevicesForUser(userId: string): Promise<number> {
    return this.prisma.user_push_devices.count({ where: { userId } });
  }

  private mapPlatform(platform: string): PushPlatform {
    const p = platform.trim().toUpperCase();
    return p === 'IOS' ? PushPlatform.IOS : PushPlatform.ANDROID;
  }

  async registerDevice(userId: string, dto: RegisterPushDto): Promise<void> {
    const token = dto.token.trim();
    const now = new Date();
    const platform = this.mapPlatform(dto.platform);

    await this.prisma.user_push_devices.upsert({
      where: { token },
      create: {
        id: crypto.randomUUID(),
        userId,
        token,
        platform,
        deviceId: dto.deviceId?.trim() || null,
        appSurface: dto.appSurface?.trim() || null,
        locale: dto.locale?.trim() || null,
        updatedAt: now,
      },
      update: {
        userId,
        platform,
        deviceId: dto.deviceId?.trim() || null,
        appSurface: dto.appSurface?.trim() || null,
        locale: dto.locale?.trim() || null,
        updatedAt: now,
      },
    });
  }

  async unregisterDevice(
    userId: string,
    data: { token?: string; deviceId?: string },
  ): Promise<void> {
    const token = data.token?.trim();
    const deviceId = data.deviceId?.trim();

    if (token) {
      await this.prisma.user_push_devices.deleteMany({
        where: { userId, token },
      });
      return;
    }

    if (deviceId) {
      await this.prisma.user_push_devices.deleteMany({
        where: { userId, deviceId },
      });
    }
  }

  /**
   * Send FCM to all registered devices for a user. Failures on individual tokens are logged;
   * invalid tokens are removed.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.firebaseReady) return;

    const devices = await this.prisma.user_push_devices.findMany({
      where: { userId },
      select: { id: true, token: true },
    });

    if (devices.length === 0) return;

    const data: Record<string, string> = {};
    if (payload.actionUrl) data.actionUrl = payload.actionUrl;
    if (payload.notificationId) data.notificationId = payload.notificationId;
    if (payload.type) data.type = payload.type;

    await Promise.all(
      devices.map(async (device) => {
        try {
          await admin.messaging().send({
            token: device.token,
            notification: {
              title: payload.title,
              body: payload.body,
            },
            data,
            android: { priority: 'high' },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  alert: {
                    title: payload.title,
                    body: payload.body,
                  },
                },
              },
            },
          });
        } catch (e: unknown) {
          const code =
            e && typeof e === 'object' && 'code' in e
              ? String((e as { code?: string }).code)
              : '';
          this.logger.warn(
            `FCM send failed user=${userId} tokenPrefix=${device.token.slice(0, 12)} code=${code}`,
          );
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            await this.prisma.user_push_devices.delete({ where: { id: device.id } }).catch(() => {});
          }
        }
      }),
    );
  }
}
