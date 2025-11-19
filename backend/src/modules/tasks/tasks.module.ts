import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { NotificationsController } from './notifications.controller';
import { TasksSchedulerService } from './tasks-scheduler.service';
import { Task } from './entities/task.entity';
import { TaskLog } from './entities/task-log.entity';
import { Notification } from './entities/notification.entity';
import { Team } from '../teams/entities/team.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskLog, Notification, Team])],
  controllers: [TasksController, NotificationsController],
  providers: [TasksService, TasksSchedulerService],
})
export class TasksModule {}
