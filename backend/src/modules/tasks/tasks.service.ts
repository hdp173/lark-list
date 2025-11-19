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

    // If this is a subtask, log to parent task history
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
    // Get all team IDs where user is a member or creator
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

    // Filter by creator
    if (query.creatorId) qb.andWhere('task.creatorId = :cid', { cid: query.creatorId });

    // Filter by assignee
    if (query.assigneeId) qb.andWhere('assignee.id = :aid', { aid: query.assigneeId });

    // Filter by team(s)
    if (query.teamId) {
      qb.andWhere('taskTeam.id = :tid', { tid: query.teamId });
    }

    // Filter by creation date range
    if (query.createdAfter)
      qb.andWhere('task.createdAt >= :createdAfter', { createdAfter: query.createdAfter });
    if (query.createdBefore)
      qb.andWhere('task.createdAt <= :createdBefore', { createdBefore: query.createdBefore });

    // Filter by due date range
    if (query.dueAfter) qb.andWhere('task.dueDate >= :dueAfter', { dueAfter: query.dueAfter });
    if (query.dueBefore) qb.andWhere('task.dueDate <= :dueBefore', { dueBefore: query.dueBefore });

    // Apply sorting
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

      // Track old values for logging
      const oldTitle = task.title;
      const oldDescription = task.description;
      const oldStatus = task.status;

      // Log title change
      if (updateDto.title !== undefined && updateDto.title !== oldTitle) {
        await this.logHistory(
          id,
          user,
          `Changed title from "${oldTitle}" to "${updateDto.title}"`,
          queryRunner.manager
        );
      }

      // Log description change
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

      // Log status change
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

      // Update parent task status based on subtask status changes
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

    // Check if all subtasks are completed (DONE)
    const allDone = parent.subtasks.every((t: Task) => t.status === TaskStatus.DONE);

    if (allDone) {
      // All subtasks are done, complete the parent task
      if (parent.status !== TaskStatus.DONE) {
        parent.status = TaskStatus.DONE;
        await manager.save(parent);
        // Recursively update grandparent if exists
        if (parent.parentId) {
          await this.updateParentBasedOnSubtasks(parent.parentId, manager);
        }
      }
    } else {
      // At least one subtask is not done, parent should not be DONE
      if (parent.status === TaskStatus.DONE) {
        // Revert parent to TODO if it was DONE
        parent.status = TaskStatus.TODO;
        await manager.save(parent);
        // Recursively update grandparent if exists
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

      // Only creator can delete task
      if (task.creatorId !== user.id) {
        throw new NotFoundException('Only creator can delete task');
      }

      // Recursively delete all subtasks first, logging to parent history
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

    // Recursively delete each subtask and its children
    for (const subtask of subtasks) {
      // Log to main parent task history before deletion (always log to the top-level parent)
      if (mainParentTask && user) {
        const logRepo = manager.getRepository(TaskLog);
        await logRepo.save({
          taskId: mainParentTask.id,
          userId: user.id,
          type: LogType.HISTORY,
          content: `Deleted subtask: "${subtask.title}"`,
        });
      }

      // First delete all nested subtasks of this subtask (pass same mainParentTask)
      await this.deleteSubtasksRecursively(subtask.id, manager, mainParentTask, user);
      // Then delete the subtask itself
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
