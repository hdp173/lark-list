import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTaskDto } from './dto/query-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@ApiTags('任务管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: '创建任务' })
  create(@Request() req: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: '获取可见任务列表' })
  findAll(@Request() req: any, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(req.user, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新任务' })
  update(@Param('id') id: string, @Request() req: any, @Body() updateDto: UpdateTaskDto) {
    return this.tasksService.update(id, req.user, updateDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: '添加评论' })
  addComment(@Param('id') id: string, @Request() req: any, @Body('content') content: string) {
    return this.tasksService.addComment(id, req.user, content);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '获取任务历史记录' })
  getHistory(@Param('id') id: string) {
    return this.tasksService.getHistory(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除任务' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.remove(id, req.user);
  }

  @Post(':id/followers/:userId')
  @ApiOperation({ summary: '添加关注者' })
  addFollower(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.addFollower(id, userId, req.user);
  }

  @Delete(':id/followers/:userId')
  @ApiOperation({ summary: '移除关注者' })
  removeFollower(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.removeFollower(id, userId, req.user);
  }

  @Post(':id/assignees/:userId')
  @ApiOperation({ summary: '分配任务执行者' })
  addAssignee(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body('addToFollowers') addToFollowers?: boolean
  ) {
    return this.tasksService.addAssignee(id, userId, req.user, addToFollowers);
  }

  @Delete(':id/assignees/:userId')
  @ApiOperation({ summary: '移除任务执行者' })
  removeAssignee(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.removeAssignee(id, userId, req.user);
  }

  @Post(':id/teams/:teamId')
  @ApiOperation({ summary: '添加团队' })
  addTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Request() req: any) {
    return this.tasksService.addTeam(id, teamId, req.user);
  }

  @Delete(':id/teams/:teamId')
  @ApiOperation({ summary: '移除团队' })
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Request() req: any) {
    return this.tasksService.removeTeam(id, teamId, req.user);
  }
}
