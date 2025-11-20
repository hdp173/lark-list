import React from 'react';
import { Table, Select } from 'antd';
import dayjs from 'dayjs';
import { Task, User } from './types';
import { TaskStatus, TASK_STATUS_OPTIONS, getTaskStatusLabel } from '../types';

interface TaskTableProps {
  tasks: Task[];
  users: User[];
  loading: boolean;
  onTaskClick: (task: Task) => void;
  onStatusChange: (task: Task, newStatus: TaskStatus) => void;
  onAssigneesChange: (taskId: string, newAssigneeIds: string[]) => void;
  onFollowersChange: (taskId: string, newFollowerIds: string[]) => void;
}

const TaskTable: React.FC<TaskTableProps> = ({
  tasks,
  users,
  loading,
  onTaskClick,
  onStatusChange,
  onAssigneesChange,
  onFollowersChange,
}) => {
  const columns = [
    {
      title: 'Task Name',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Task) => (
        <span onClick={() => onTaskClick(record)} style={{ cursor: 'pointer', color: '#1890ff' }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      ellipsis: true,
      render: (status: TaskStatus, record: Task) => {
        return (
          <Select
            value={status}
            onChange={(newStatus: TaskStatus) => onStatusChange(record, newStatus)}
            style={{ width: 100 }}
            size="small"
          >
            {TASK_STATUS_OPTIONS.map((statusOption) => (
              <Select.Option key={statusOption} value={statusOption}>
                {getTaskStatusLabel(statusOption)}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Creator',
      dataIndex: ['creator', 'username'],
      key: 'creator',
      width: 120,
      ellipsis: true,
      render: (text: string) => (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {text || '-'}
        </span>
      ),
    },
    {
      title: 'Assignees',
      dataIndex: 'assignees',
      key: 'assignees',
      width: 200,
      ellipsis: true,
      render: (assignees: any[], record: Task) => {
        const assigneeIds = (assignees || []).map((a) => a.id);
        return (
          <Select
            mode="multiple"
            value={assigneeIds}
            onChange={(newIds: string[]) => onAssigneesChange(record.id, newIds)}
            style={{ width: '100%', minWidth: 150, height: '24px' }}
            size="small"
            placeholder="Select assignees"
            showSearch
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            filterOption={(input, option) =>
              String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
            dropdownStyle={{ maxHeight: 200, overflow: 'auto' }}
            className="table-select"
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Followers',
      dataIndex: 'followers',
      key: 'followers',
      width: 200,
      ellipsis: true,
      render: (followers: any[], record: Task) => {
        const followerIds = (followers || []).map((f) => f.id);
        return (
          <Select
            mode="multiple"
            value={followerIds}
            onChange={(newIds: string[]) => onFollowersChange(record.id, newIds)}
            style={{ width: '100%', minWidth: 150, height: '24px' }}
            size="small"
            placeholder="Select followers"
            showSearch
            maxTagCount={1}
            maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}`}
            filterOption={(input, option) =>
              String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
            dropdownStyle={{ maxHeight: 200, overflow: 'auto' }}
            className="table-select"
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      ellipsis: true,
      render: (date: string) => (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {date ? dayjs(date).format('YYYY-MM-DD') : '-'}
        </span>
      ),
    },
  ];

  return (
    <>
      <style>
        {`
          .table-select .ant-select-selector {
            max-height: 24px !important;
            overflow: hidden !important;
          }
          .table-select .ant-select-selection-overflow {
            max-height: 24px !important;
            overflow: hidden !important;
          }
        `}
      </style>
      <Table
        columns={columns}
        dataSource={tasks}
        loading={loading}
        pagination={false}
        scroll={{ x: 'max-content' }}
        style={{ tableLayout: 'fixed' }}
        components={{
          body: {
            cell: (props: any) => (
              <td
                {...props}
                style={{
                  ...props.style,
                  padding: '8px 16px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxHeight: '32px',
                  height: '32px',
                }}
              />
            ),
          },
        }}
        expandable={{ defaultExpandAllRows: true }}
      />
    </>
  );
};

export default TaskTable;

