import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';
import { User } from './modules/users/entities/user.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { TaskLog } from './modules/tasks/entities/task-log.entity';
import { Team } from './modules/teams/entities/team.entity';
import { Notification } from './modules/tasks/entities/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'todolist',
      entities: [User, Task, TaskLog, Team, Notification],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    TeamsModule,
  ],
})
export class AppModule {}
