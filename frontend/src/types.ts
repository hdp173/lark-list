export enum TaskStatus {
  TODO = 'TODO',
  PENDING = 'PENDING',
  DONE = 'DONE',
}

export type TaskStatusType = TaskStatus;

// Array of all task statuses for iteration (e.g., in Select dropdowns)
export const TASK_STATUS_OPTIONS: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.PENDING,
  TaskStatus.DONE,
];

// Status color mapping for UI components
export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'blue',
  [TaskStatus.PENDING]: 'orange',
  [TaskStatus.DONE]: 'green',
};

// Helper function to capitalize status for display
export const getTaskStatusLabel = (status: TaskStatus): string => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

