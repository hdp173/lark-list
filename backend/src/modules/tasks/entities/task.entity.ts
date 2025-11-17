import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { TaskLog } from './task-log.entity';
import { Team } from '../../teams/entities/team.entity';

export enum TaskStatus {
  TODO = 'TODO',
  PENDING = 'PENDING',
  DONE = 'DONE',
}

@Entity()
export class Task {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.TODO }) status: TaskStatus;
  @Column({ type: 'timestamp', nullable: true }) dueDate: Date;

  @Column({ type: 'boolean', default: false }) isRecurring: boolean;
  @Column({ type: 'varchar', nullable: true }) recurrenceRule: string;
  @Column({ type: 'timestamp', nullable: true }) lastNotificationSent: Date;
  @Column({ type: 'boolean', default: true }) isPrivate: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'creatorId' }) creator: User;
  @Column() creatorId: string;

  @ManyToMany(() => User) @JoinTable({ name: 'task_assignees' }) assignees: User[];
  @ManyToMany(() => User) @JoinTable({ name: 'task_followers' }) followers: User[];
  @ManyToMany(() => Team) @JoinTable({ name: 'task_teams' }) teams: Team[];

  @ManyToOne(() => Task, (task) => task.subtasks, { onDelete: 'CASCADE' }) parent: Task;
  @Column({ nullable: true }) parentId: string;

  @OneToMany(() => Task, (task) => task.parent) subtasks: Task[];
  @OneToMany(() => TaskLog, (log) => log.task) logs: TaskLog[];

  @CreateDateColumn() createdAt: Date;
}
