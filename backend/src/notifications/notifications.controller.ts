import { Body, Controller, Delete, Get, Patch, Param, Post, Request, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterPushDto, UnregisterPushDto } from './dto/register-push.dto';
import { PushTestDto } from './dto/push-test.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private pushNotificationService: PushNotificationService,
  ) {}

  @Get()
  async findAll(@Request() req: any) {
    return this.notificationsService.findAllByUser(req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  /** Register FCM/APNs device token after OS notification permission is granted. */
  @Post('push/register')
  async registerPush(@Request() req: { user: { id: string } }, @Body() body: RegisterPushDto) {
    await this.pushNotificationService.registerDevice(req.user.id, body);
    return { ok: true, pushEnabled: this.pushNotificationService.isEnabled() };
  }

  @Delete('push/register')
  async unregisterPush(@Request() req: { user: { id: string } }, @Body() body: UnregisterPushDto) {
    await this.pushNotificationService.unregisterDevice(req.user.id, body);
    return { ok: true };
  }

  /** Send a test FCM/APNs message to the current user's registered devices. */
  @Post('push/test')
  async pushTestSelf(@Request() req: { user: { id: string } }, @Body() body: PushTestDto) {
    const userId = req.user.id;
    const title = body.title?.trim() || 'Bio Vera';
    const message = body.message?.trim() || 'Test push notification';
    await this.pushNotificationService.sendToUser(userId, {
      title,
      body: message,
      type: 'SYSTEM',
      actionUrl: '/notifications',
    });
    const count = await this.pushNotificationService.countDevicesForUser(userId);
    return {
      ok: true,
      pushEnabled: this.pushNotificationService.isEnabled(),
      devices: count,
      userId,
    };
  }

  /** Admin: send test push to any user (by userId in body). */
  @Post('push/test-user')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async pushTestUser(@Body() body: PushTestDto) {
    if (!body.userId) {
      return { ok: false, error: 'userId required' };
    }
    const title = body.title?.trim() || 'Bio Vera';
    const message = body.message?.trim() || 'Test push notification';
    await this.pushNotificationService.sendToUser(body.userId, {
      title,
      body: message,
      type: 'SYSTEM',
    });
    const count = await this.pushNotificationService.countDevicesForUser(body.userId);
    return {
      ok: true,
      pushEnabled: this.pushNotificationService.isEnabled(),
      devices: count,
      userId: body.userId,
    };
  }
}
