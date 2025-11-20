import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './entities/team.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>
  ) {}

  async create(user: User, createDto: CreateTeamDto) {
    const team = this.teamRepo.create({
      ...createDto,
      creatorId: user.id,
      members: createDto.memberIds ? createDto.memberIds.map((id) => ({ id }) as User) : [user],
    });

    return this.teamRepo.save(team);
  }

  async findAll(user: User) {
    return this.teamRepo
      .createQueryBuilder('team')
      .leftJoinAndSelect('team.members', 'member')
      .leftJoinAndSelect('team.creator', 'creator')
      .leftJoin('team.members', 'userMember')
      .where('team.creatorId = :userId OR userMember.id = :userId', { userId: user.id })
      .getMany();
  }

  async findOne(id: string) {
    const team = await this.teamRepo.findOne({
      where: { id },
      relations: ['members', 'creator'],
    });

    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async addMember(teamId: string, userId: string) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) throw new NotFoundException('Team not found');

    const isMember = team.members?.some((m) => m.id === userId);
    if (isMember) {
      return { message: 'User is already a member' };
    }

    if (!team.members) team.members = [];
    team.members.push({ id: userId } as User);
    await this.teamRepo.save(team);

    return { message: 'Member added successfully' };
  }

  async removeMember(teamId: string, userId: string) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId },
      relations: ['members'],
    });

    if (!team) throw new NotFoundException('Team not found');

    team.members = team.members?.filter((m) => m.id !== userId) || [];
    await this.teamRepo.save(team);

    return { message: 'Member removed successfully' };
  }

  async remove(id: string, user: User) {
    const team = await this.teamRepo.findOne({ where: { id } });

    if (!team) throw new NotFoundException('Team not found');

    if (team.creatorId !== user.id) {
      throw new NotFoundException('Only creator can delete team');
    }

    await this.teamRepo.remove(team);
    return { message: 'Team deleted successfully' };
  }
}
