import { TaskStatus } from '../types';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignees?: { username: string; id: string }[];
  creator?: { username: string; id: string };
  followers?: { username: string; id: string }[];
  teams?: { id: string; name: string }[];
  dueDate?: string;
  children?: Task[];
  parentId?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  username: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  creator?: { id: string; username: string };
  members?: { id: string; username: string }[];
  createdAt?: string;
}

export interface FilterState {
  creatorId?: string;
  assigneeId?: string;
  teamId?: string;
  createdDateRange?: any;
  sortBy: string;
  sortOrder: string;
}

