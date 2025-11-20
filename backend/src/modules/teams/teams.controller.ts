import { Controller, Get, Post, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create team' })
  create(@Request() req: any, @Body() createDto: CreateTeamDto) {
    return this.teamsService.create(req.user, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user teams' })
  findAll(@Request() req: any) {
    return this.teamsService.findAll(req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Post(':id/members/:userId')
  @ApiOperation({ summary: 'Add member to team' })
  addMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.addMember(id, userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from team' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.teamsService.removeMember(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team' })
  remove(@Param('id') id: string, @Request() req: any) {
    return this.teamsService.remove(id, req.user);
  }
}
