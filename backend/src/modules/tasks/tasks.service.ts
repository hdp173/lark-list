import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { User } from '../users/entities/user.entity';
import { TaskLog, LogType } from './entities/task-log.entity';
import { Team } from '../teams/entities/team.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task) private taskRepo: Repository<Task>,
    @InjectRepository(TaskLog) private logRepo: Repository<TaskLog>,
    @InjectRepository(Team) private teamRepo: Repository<Team>,
    private dataSource: DataSource
  ) {}

  async create(user: User, createDto: CreateTaskDto) {
    const task = this.taskRepo.create({
      ...createDto,
      creatorId: user.id,
      followers: [],
      assignees: [],
      teams: [],
    });

    if (createDto.assigneeIds && createDto.assigneeIds.length > 0) {
      task.assignees = createDto.assigneeIds.map((id) => ({ id } as User));
    }

    if (createDto.followerIds && createDto.followerIds.length > 0) {
      task.followers = createDto.followerIds.map((id) => ({ id }) as User);
    }

    if (createDto.teamIds && createDto.teamIds.length > 0) {
      task.teams = createDto.teamIds.map((id) => ({ id } as Team));
    }

    if (createDto.parentId) {
      task.parent = { id: createDto.parentId } as Task;
    }

    const savedTask = await this.taskRepo.save(task);
    await this.logHistory(savedTask.id, user, 'Created task');

    // 如果是子任务，记录到父任务历史
    if (savedTask.parentId) {
      const parentTask = await this.taskRepo.findOne({
        where: { id: savedTask.parentId },
        relations: ['creator'],
      });
      if (parentTask) {
        await this.logHistory(
          savedTask.parentId,
          user,
          `Created subtask: "${savedTask.title}"`
        );
      }
    }

    return savedTask;
  }

  async findAll(user: User, query: QueryTaskDto) {
    // 获取用户作为成员或创建者的所有团队ID
    const userTeams = await this.teamRepo
      .createQueryBuilder('team')
      .leftJoin('team.members', 'member')
      .where('team.creatorId = :userId OR member.id = :userId', { userId: user.id })
      .select('team.id')
      .getMany();
    const teamIds = userTeams.map((t) => t.id);

    const qb = this.taskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignees', 'assignees')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.followers', 'followers')
      .leftJoinAndSelect('task.teams', 'teams')
      .leftJoin('task.followers', 'follower')
      .leftJoin('task.assignees', 'assignee')
      .leftJoin('task.teams', 'taskTeam')
      .where(
        '(task.creatorId = :userId OR follower.id = :userId OR assignee.id = :userId' +
          (teamIds.length > 0 ? ' OR taskTeam.id IN (:...teamIds)' : '') +
          ')',
        teamIds.length > 0 ? { userId: user.id, teamIds } : { userId: user.id }
      );

    // 按创建者筛选
    if (query.creatorId) qb.andWhere('task.creatorId = :cid', { cid: query.creatorId });

    // 按执行者筛选
    if (query.assigneeId) qb.andWhere('assignee.id = :aid', { aid: query.assigneeId });

    // 按团队筛选
    if (query.teamId) {
      qb.andWhere('taskTeam.id = :tid', { tid: query.teamId });
    }

    // 按创建日期范围筛选
    if (query.createdAfter)
      qb.andWhere('task.createdAt >= :createdAfter', { createdAfter: query.createdAfter });
    if (query.createdBefore)
      qb.andWhere('task.createdAt <= :createdBefore', { createdBefore: query.createdBefore });

    // 按截止日期范围筛选
    if (query.dueAfter) qb.andWhere('task.dueDate >= :dueAfter', { dueAfter: query.dueAfter });
    if (query.dueBefore) qb.andWhere('task.dueDate <= :dueBefore', { dueBefore: query.dueBefore });

    // 应用排序
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';

    if (sortBy === 'creator') {
      qb.orderBy('creator.username', sortOrder);
    } else {
      qb.orderBy(`task.${sortBy}`, sortOrder);
    }

    return qb.getMany();
  }

  async update(id: string, user: User, updateDto: UpdateTaskDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await queryRunner.manager.findOne(Task, {
        where: { id },
        relations: ['parent', 'subtasks', 'teams'],
      });

      if (!task) throw new NotFoundException();

      // 记录旧值用于日志
      const oldTitle = task.title;
      const oldDescription = task.description;
      const oldStatus = task.status;

      // 记录标题变更
      if (updateDto.title !== undefined && updateDto.title !== oldTitle) {
        await this.logHistory(
          id,
          user,
          `Changed title from "${oldTitle}" to "${updateDto.title}"`,
          queryRunner.manager
        );
      }

      // 记录描述变更
      if (updateDto.description !== undefined && updateDto.description !== oldDescription) {
        const oldDesc = oldDescription || '(empty)';
        const newDesc = updateDto.description || '(empty)';
        await this.logHistory(
          id,
          user,
          `Changed description from "${oldDesc}" to "${newDesc}"`,
          queryRunner.manager
        );
      }

      // 记录状态变更
      if (updateDto.status !== undefined && updateDto.status !== oldStatus) {
        await this.logHistory(
          id,
          user,
          `Changed status from "${oldStatus}" to "${updateDto.status}"`,
          queryRunner.manager
        );
      }

      Object.assign(task, updateDto);
      await queryRunner.manager.save(task);

      // 根据子任务状态更新父任务状态
      if (
        task.parentId &&
        updateDto.status !== undefined &&
        oldStatus !== updateDto.status
      ) {
        await this.updateParentBasedOnSubtasks(task.parentId, queryRunner.manager);
      }

      await queryRunner.commitTransaction();
      return task;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async updateParentBasedOnSubtasks(parentId: string, manager: any) {
    const parent = await manager.findOne(Task, {
      where: { id: parentId },
      relations: ['subtasks'],
    });

    if (!parent || !parent.subtasks || parent.subtasks.length === 0) return;

    // 检查所有子任务是否已完成
    const allDone = parent.subtasks.every((t: Task) => t.status === TaskStatus.DONE);

    if (allDone) {
      // 所有子任务已完成，完成父任务
      if (parent.status !== TaskStatus.DONE) {
        parent.status = TaskStatus.DONE;
        await manager.save(parent);
        // 如果存在祖父任务则递归更新
        if (parent.parentId) {
          await this.updateParentBasedOnSubtasks(parent.parentId, manager);
        }
      }
    } else {
      // 至少有一个子任务未完成，父任务不应为已完成状态
      if (parent.status === TaskStatus.DONE) {
        // 如果父任务是已完成状态则恢复为待办
        parent.status = TaskStatus.TODO;
        await manager.save(parent);
        // 如果存在祖父任务则递归更新
        if (parent.parentId) {
          await this.updateParentBasedOnSubtasks(parent.parentId, manager);
        }
      }
    }
  }

  async addComment(taskId: string, user: User, content: string) {
    const log = this.logRepo.create({
      taskId,
      userId: user.id,
      type: LogType.COMMENT,
      content,
    });
    return this.logRepo.save(log);
  }

  async getHistory(taskId: string) {
    return this.logRepo.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  async remove(id: string, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const task = await queryRunner.manager.findOne(Task, {
        where: { id },
        relations: ['creator'],
      });

      if (!task) throw new NotFoundException('Task not found');

      // 只有创建者可以删除任务
      if (task.creatorId !== user.id) {
        throw new NotFoundException('Only creator can delete task');
      }

      // 递归删除所有子任务，记录到父任务历史
      await this.deleteSubtasksRecursively(id, queryRunner.manager, task, user);

      // Delete the parent task
      await queryRunner.manager.remove(Task, task);

      await queryRunner.commitTransaction();
      return { message: 'Task deleted successfully' };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private async deleteSubtasksRecursively(
    parentId: string,
    manager: any,
    mainParentTask?: Task,
    user?: User
  ) {
    // Find all direct subtasks of this parent
    const subtasks = await manager.find(Task, {
      where: { parentId },
    });

    // 递归删除每个子任务及其子级
    for (const subtask of subtasks) {
      // 删除前记录到主父任务历史（始终记录到顶级父任务）
      if (mainParentTask && user) {
        const logRepo = manager.getRepository(TaskLog);
        await logRepo.save({
          taskId: mainParentTask.id,
          userId: user.id,
          type: LogType.HISTORY,
          content: `Deleted subtask: "${subtask.title}"`,
        });
      }

      // 首先删除此子任务的所有嵌套子任务（传递相同的主父任务）
      await this.deleteSubtasksRecursively(subtask.id, manager, mainParentTask, user);
      // 然后删除子任务本身
      await manager.remove(Task, subtask);
    }
  }

  async addFollower(taskId: string, userId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['followers'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Check if user is already a follower
    const isFollower = task.followers?.some((f) => f.id === userId);
    if (isFollower) {
      return { message: 'User is already a follower' };
    }

    // Get user info for logging
    const userToAdd = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    const username = userToAdd?.username || userId;

    // Add follower
    if (!task.followers) task.followers = [];
    task.followers.push({ id: userId } as User);
    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Added follower: ${username}`);

    return { message: 'Follower added successfully' };
  }

  async removeFollower(taskId: string, userId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['followers'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Get user info for logging before removal
    let username = userId;
    const userToRemove = task.followers?.find((f) => f.id === userId);
    if (userToRemove && userToRemove.username) {
      username = userToRemove.username;
    } else {
      // Fallback: query user repository
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) username = user.username;
    }

    // Remove follower
    task.followers = task.followers?.filter((f) => f.id !== userId) || [];
    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Removed follower: ${username}`);

    return { message: 'Follower removed successfully' };
  }

  async addAssignee(taskId: string, userId: string, currentUser: User, addToFollowers: boolean = false) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignees', 'followers'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Check if user is already an assignee
    const isAssignee = task.assignees?.some((a) => a.id === userId);
    if (isAssignee) {
      return { message: 'User is already an assignee' };
    }

    // Get user info for logging
    const userToAdd = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    const username = userToAdd?.username || userId;

    // Add assignee
    if (!task.assignees) task.assignees = [];
    task.assignees.push({ id: userId } as User);

    // If addToFollowers is true, also add to followers so they can see the task
    if (addToFollowers) {
      const isFollower = task.followers?.some((f) => f.id === userId);
      if (!isFollower) {
        if (!task.followers) task.followers = [];
        task.followers.push({ id: userId } as User);
      }
    }

    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Added assignee: ${username}`);

    return { message: 'Assignee added successfully' };
  }

  async removeAssignee(taskId: string, userId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['assignees'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Get user info for logging before removal
    let username = userId;
    const userToRemove = task.assignees?.find((a) => a.id === userId);
    if (userToRemove && userToRemove.username) {
      username = userToRemove.username;
    } else {
      // Fallback: query user repository
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) username = user.username;
    }

    // Remove assignee
    task.assignees = task.assignees?.filter((a) => a.id !== userId) || [];
    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Removed assignee: ${username}`);

    return { message: 'Assignee removed successfully' };
  }

  async addTeam(taskId: string, teamId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['teams'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Check if team is already assigned
    const isTeamAssigned = task.teams?.some((t) => t.id === teamId);
    if (isTeamAssigned) {
      return { message: 'Team is already assigned to this task' };
    }

    // Get team info for logging
    const teamToAdd = await this.teamRepo.findOne({ where: { id: teamId } });
    const teamName = teamToAdd?.name || teamId;

    // Add team
    if (!task.teams) task.teams = [];
    task.teams.push({ id: teamId } as Team);
    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Added team: ${teamName}`);

    return { message: 'Team added successfully' };
  }

  async removeTeam(taskId: string, teamId: string, currentUser: User) {
    const task = await this.taskRepo.findOne({
      where: { id: taskId },
      relations: ['teams'],
    });

    if (!task) throw new NotFoundException('Task not found');

    // Get team info for logging before removal
    let teamName = teamId;
    const teamToRemove = task.teams?.find((t) => t.id === teamId);
    if (teamToRemove && teamToRemove.name) {
      teamName = teamToRemove.name;
    } else {
      // Fallback: query team repository
      const team = await this.teamRepo.findOne({ where: { id: teamId } });
      if (team) teamName = team.name;
    }

    // Remove team
    task.teams = task.teams?.filter((t) => t.id !== teamId) || [];
    await this.taskRepo.save(task);

    // Log the activity
    await this.logHistory(taskId, currentUser, `Removed team: ${teamName}`);

    return { message: 'Team removed successfully' };
  }

  private async logHistory(taskId: string, user: User, action: string, manager?: any) {
    const repo = manager ? manager.getRepository(TaskLog) : this.logRepo;
    await repo.save({
      taskId,
      userId: user.id,
      type: LogType.HISTORY,
      content: action,
    });
  }
}
