import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Task } from './task.entity';
import { User } from '../../users/entities/user.entity';

export enum LogType {
  HISTORY = 'HISTORY',
  COMMENT = 'COMMENT',
}

@Entity()
export class TaskLog {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: LogType }) type: LogType;
  @Column() content: string;
  @ManyToOne(() => Task, (task) => task.logs, { onDelete: 'CASCADE' }) task: Task;
  @Column() taskId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) user: User;
  @Column() userId: string;
  @CreateDateColumn() createdAt: Date;
}
