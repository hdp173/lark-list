import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ example: 'New Feature' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ type: [String], description: 'Array of assignee user IDs' })
  @IsOptional()
  assigneeIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Array of follower user IDs' })
  @IsOptional()
  followerIds?: string[];

  @ApiPropertyOptional({ type: [String], description: 'Array of team IDs' })
  @IsOptional()
  teamIds?: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  isRecurring?: boolean;

  @ApiPropertyOptional({ description: 'Recurrence rule: daily, weekly, monthly' })
  @IsString()
  @IsOptional()
  recurrenceRule?: string;

  @ApiPropertyOptional({ description: 'Whether the task is private (default: true)' })
  @IsOptional()
  isPrivate?: boolean;
}
