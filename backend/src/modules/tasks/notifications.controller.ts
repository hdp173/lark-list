import { Controller, Get, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  async findAll(@Request() req: any) {
    return this.notificationRepo.find({
      where: { userId: req.user.id },
      order: { createdAt: 'DESC' },
      relations: ['task'],
      take: 50,
    });
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications count' })
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
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId: req.user.id },
    });

    if (notification) {
      notification.isRead = true;
      await this.notificationRepo.save(notification);
    }

    return { message: 'Notification marked as read' };
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Request() req: any) {
    await this.notificationRepo.update({ userId: req.user.id, isRead: false }, { isRead: true });

    return { message: 'All notifications marked as read' };
  }
}
