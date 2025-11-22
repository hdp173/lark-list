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

  // Check for tasks due within 24 hours every hour
  @Cron(CronExpression.EVERY_HOUR)
  async checkDueTasks() {
    this.logger.log('Checking for due tasks...');

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find tasks due within 24 hours that are not completed
    const dueSoonTasks = await this.taskRepo.find({
      where: {
        status: TaskStatus.TODO,
        dueDate: MoreThan(now),
      },
      relations: ['assignees', 'creator', 'followers', 'teams'],
    });

    for (const task of dueSoonTasks) {
      const dueDate = new Date(task.dueDate);

      // Check if task is due within 24 hours
      if (dueDate <= tomorrow) {
        // Check if notification has already been sent
        const lastNotification = task.lastNotificationSent
          ? new Date(task.lastNotificationSent)
          : null;
        const hoursSinceLastNotification = lastNotification
          ? (now.getTime() - lastNotification.getTime()) / (1000 * 60 * 60)
          : 999;

        // Send notification if more than 12 hours have passed since last notification
        if (hoursSinceLastNotification > 12) {
          await this.sendDueNotification(task, dueDate);

          // Update last notification time
          task.lastNotificationSent = now;
          await this.taskRepo.save(task);
        }
      }
    }

    // Find overdue tasks that are not completed
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

      // Send overdue reminder every 24 hours
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

  // Check for recurring tasks every day at 2 AM
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
    // Create new task instance based on recurrence rule
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
    // Simple recurrence rule parsing: daily, weekly, monthly
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
