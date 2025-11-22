import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';

@ApiTags('团队管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: '创建团队' })
  create(@Request() req: any, @Body() createDto: CreateTeamDto) {
    return this.teamsService.create(req.user, createDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户团队列表' })
  findAll(@Request() req: any) {
    return this.teamsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取团队详情' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post(':id/members/:userId')
  @ApiOperation({ summary: '添加团队成员' })
  addMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '移除团队成员' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除团队' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.teamsService.remove(id, req.user);
  }
}
