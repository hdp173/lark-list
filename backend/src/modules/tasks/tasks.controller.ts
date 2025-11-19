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

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create task' })
  create(@Request() req: any, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.create(req.user, createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get visible tasks' })
  findAll(@Request() req: any, @Query() query: QueryTaskDto) {
    return this.tasksService.findAll(req.user, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(@Param('id') id: string, @Request() req: any, @Body() updateDto: UpdateTaskDto) {
    return this.tasksService.update(id, req.user, updateDto);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment' })
  addComment(@Param('id') id: string, @Request() req: any, @Body('content') content: string) {
    return this.tasksService.addComment(id, req.user, content);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get task history/comments' })
  getHistory(@Param('id') id: string) {
    return this.tasksService.getHistory(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete task' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.tasksService.remove(id, req.user);
  }

  @Post(':id/followers/:userId')
  @ApiOperation({ summary: 'Add follower to task' })
  addFollower(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.addFollower(id, userId, req.user);
  }

  @Delete(':id/followers/:userId')
  @ApiOperation({ summary: 'Remove follower from task' })
  removeFollower(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.removeFollower(id, userId, req.user);
  }

  @Post(':id/assignees/:userId')
  @ApiOperation({ summary: 'Add assignee to task' })
  addAssignee(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body('addToFollowers') addToFollowers?: boolean
  ) {
    return this.tasksService.addAssignee(id, userId, req.user, addToFollowers);
  }

  @Delete(':id/assignees/:userId')
  @ApiOperation({ summary: 'Remove assignee from task' })
  removeAssignee(@Param('id') id: string, @Param('userId') userId: string, @Request() req: any) {
    return this.tasksService.removeAssignee(id, userId, req.user);
  }

  @Post(':id/teams/:teamId')
  @ApiOperation({ summary: 'Add team to task' })
  addTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Request() req: any) {
    return this.tasksService.addTeam(id, teamId, req.user);
  }

  @Delete(':id/teams/:teamId')
  @ApiOperation({ summary: 'Remove team from task' })
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string, @Request() req: any) {
    return this.tasksService.removeTeam(id, teamId, req.user);
  }
}
