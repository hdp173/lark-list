import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { TeamsModule } from './modules/teams/teams.module';
import { User } from './modules/users/entities/user.entity';
import { Task } from './modules/tasks/entities/task.entity';
import { TaskLog } from './modules/tasks/entities/task-log.entity';
import { Team } from './modules/teams/entities/team.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'db',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'todolist',
      entities: [User, Task, TaskLog, Team],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    TasksModule,
    TeamsModule,
  ],
})
export class AppModule {}
