import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@ApiTags('通知管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>
  ) {}

  @Get()
  @ApiOperation({ summary: '获取用户通知列表' })
  async findAll(@Request() req: any) {
    return this.notificationRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
      relations: ['task'],
      take: 50,
    });
  }

  @Get('unread')
  @ApiOperation({ summary: '获取未读通知数量' })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationRepo.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId: req.user.id },
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepo.save(notification);
    }

    return { message: '通知已标记为已读' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  async markAllAsRead(@Request() req: any) {
    await this.notificationRepo.update({ userId: req.user.id, isRead: false }, { isRead: true });

    return { message: '所有通知已标记为已读' };
  }
}
