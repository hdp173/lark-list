import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class TasksSchedulerService {
  private readonly logger = new Logger(TasksSchedulerService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>
  ) {}

  // 每小时检查24小时内到期的任务
  @Cron(CronExpression.EVERY_HOUR)
  async checkDueTasks() {
    this.logger.log('Checking for due tasks...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // 查找24小时内到期且未完成的任务
    const dueSoonTasks = await this.taskRepo.find({
      where: {
        status: TaskStatus.TODO,
        dueDate: MoreThan(now),
      },
      relations: ['assignees', 'creator', 'followers', 'teams'],
    });

    for (const task of dueSoonTasks) {
      const dueDate = new Date(task.dueDate);

      // 检查任务是否在24小时内到期
      if (dueDate <= tomorrow) {
        // 检查是否已发送通知
        const lastNotification = task.lastNotificationSent
          ? new Date(task.lastNotificationSent)
          : null;
        const hoursSinceLastNotification = lastNotification
          ? (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60)
          : 999;

        // 如果距上次通知已超过12小时则发送通知
        if (hoursSinceLastNotification > 12) {
          await this.sendDueNotification(task, dueDate);

          // 更新最后通知时间
          task.lastNotificationSent = now;
          await this.taskRepo.save(task);
        }
      }
    }

    // 查找已逾期且未完成的任务
    const overdueTasks = await this.taskRepo.find({
      where: {
        status: TaskStatus.TODO,
        dueDate: LessThan(now),
      },
      relations: ['assignees', 'creator', 'followers', 'teams'],
    });

    for (const task of overdueTasks) {
      const lastNotification = task.lastNotificationSent
        ? new Date(task.lastNotificationSent)
        : null;
      const hoursSinceLastNotification = lastNotification
        ? (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60)
        : 999;

      // 每24小时发送一次逾期提醒
      if (hoursSinceLastNotification > 24) {
        await this.sendOverdueNotification(task);

        task.lastNotificationSent = now;
        await this.taskRepo.save(task);
      }
    }

    this.logger.log(
      `Checked ${dueSoonTasks.length} due soon tasks and ${overdueTasks.length} overdue tasks`
    );
  }

  // 每天凌晨2点检查循环任务
  @Cron('0 2 * * *')
  async handleRecurringTasks() {
    this.logger.log('Handling recurring tasks...');

    const recurringTasks = await this.taskRepo.find({
      where: {
        isRecurring: true,
        status: TaskStatus.DONE,
      },
      relations: ['creator', 'assignees', 'followers', 'teams'],
    });

    for (const task of recurringTasks) {
      if (task.recurrenceRule) {
        await this.createRecurringTaskInstance(task);
      }
    }

    this.logger.log(`Processed ${recurringTasks.length} recurring tasks`);
  }

  private async sendDueNotification(task: Task, dueDate: Date) {
    const users = [task.creator];
    if (task.assignees) users.push(...task.assignees);
    if (task.followers) users.push(...task.followers);

    const uniqueUsers = Array.from(new Set(users.map((u) => u.id))).map((id) =>
      users.find((u) => u.id === id)
    );

    const hoursUntilDue = Math.round((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60));

    for (const user of uniqueUsers) {
      const notification = this.notificationRepo.create({
        type: NotificationType.DUE_SOON,
        message: `Task "${task.title}" is due in ${hoursUntilDue} hours`,
        userId: user.id,
        taskId: task.id,
      });
      await this.notificationRepo.save(notification);
    }

    this.logger.log(`Sent due notification for task ${task.id} to ${uniqueUsers.length} users`);
  }

  private async sendOverdueNotification(task: Task) {
    const users = [task.creator];
    if (task.assignees) users.push(...task.assignees);
    if (task.followers) users.push(...task.followers);

    const uniqueUsers = Array.from(new Set(users.map((u) => u.id))).map((id) =>
      users.find((u) => u.id === id)
    );

    for (const user of uniqueUsers) {
      const notification = this.notificationRepo.create({
        type: NotificationType.OVERDUE,
        message: `Task "${task.title}" is overdue`,
        userId: user.id,
        taskId: task.id,
      });
      await this.notificationRepo.save(notification);
    }

    this.logger.log(`Sent overdue notification for task ${task.id} to ${uniqueUsers.length} users`);
  }

  private async createRecurringTaskInstance(originalTask: Task) {
    // 根据循环规则创建新任务实例
    const newTask = this.taskRepo.create({
      title: originalTask.title,
      description: originalTask.description,
      creatorId: originalTask.creatorId,
      assignees: originalTask.assignees,
      followers: originalTask.followers,
      teams: originalTask.teams,
      isRecurring: true,
      recurrenceRule: originalTask.recurrenceRule,
      dueDate: this.calculateNextDueDate(originalTask.recurrenceRule),
      status: TaskStatus.TODO,
    });

    await this.taskRepo.save(newTask);
    this.logger.log(`Created recurring task instance for ${originalTask.id}`);
  }

  private calculateNextDueDate(recurrenceRule: string): Date {
    const now = new Date();
    // 简单的循环规则解析：每日、每周、每月
    switch (recurrenceRule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() + 1));
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}
