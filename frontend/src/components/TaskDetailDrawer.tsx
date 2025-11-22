import React, { useState } from 'react';
import {
  Drawer,
  Button,
  Form,
  Input,
  Tag,
  Select,
  Tabs,
  Typography,
  Timeline,
} from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Task, User, Team } from './types';
import { TaskStatus, TASK_STATUS_OPTIONS, getTaskStatusLabel } from '../types';

dayjs.extend(relativeTime);

const { TextArea } = Input;

interface TaskDetailDrawerProps {
  visible: boolean;
  task: Task | null;
  users: User[];
  teams: Team[];
  history: any[];
  onClose: () => void;
  onTitleChange: (newTitle: string) => void;
  onDescriptionChange: (newDescription: string) => void;
  onStatusChange: (newStatus: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onAddAssignee: (taskId: string, userId: string, addToFollowers: boolean) => void;
  onRemoveAssignee: (taskId: string, userId: string) => void;
  onAddFollower: (taskId: string, userId: string) => void;
  onRemoveFollower: (taskId: string, userId: string) => void;
  onAddTeam: (taskId: string, teamId: string) => void;
  onRemoveTeam: (taskId: string, teamId: string) => void;
  onAddComment: (values: any) => void;
  onCreateSubtask: () => void;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({
  visible,
  task,
  users,
  teams,
  history,
  onClose,
  onTitleChange,
  onDescriptionChange,
  onStatusChange,
  onDelete,
  onAddAssignee,
  onRemoveAssignee,
  onAddFollower,
  onRemoveFollower,
  onAddTeam,
  onRemoveTeam,
  onAddComment,
  onCreateSubtask,
}) => {
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const [selectedFollowerId, setSelectedFollowerId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [localTask, setLocalTask] = useState<Task | null>(task);

  React.useEffect(() => {
    setLocalTask(task);
  }, [task]);

  if (!task || !localTask) return null;

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalTask({ ...localTask, description: e.target.value });
  };

  const handleDescriptionBlur = (value: string) => {
    onDescriptionChange(value);
  };

  return (
    <Drawer
      title=""
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <Typography.Title
          level={3}
          editable={{
            onChange: onTitleChange,
            triggerType: ['icon', 'text'],
            maxLength: 200,
          }}
          style={{ margin: 0, flex: 1 }}
        >
          {localTask.title}
        </Typography.Title>
        <Button danger icon={<DeleteOutlined />} onClick={() => onDelete(localTask.id)}>
          Delete
        </Button>
      </div>

      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: 'details',
            label: '详情',
            children: (
              <>
                <div style={{ marginTop: 15 }}>
                  <h4 style={{ marginBottom: 8 }}>Description</h4>
                  <TextArea
                    value={localTask.description || ''}
                    onChange={handleDescriptionChange}
                    onBlur={(e) => handleDescriptionBlur(e.target.value)}
                    placeholder="添加描述..."
                    rows={4}
                    style={{
                      background: '#fafafa',
                      border: '1px solid #d9d9d9',
                    }}
                  />
                </div>

                <div style={{ marginTop: 15 }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={onCreateSubtask}
                    block
                  >
                    Create Subtask
                  </Button>
                </div>

                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 500 }}>Status:</span>
                  <Select
                    value={localTask.status}
                    onChange={onStatusChange}
                    style={{ width: 120 }}
                  >
                    {TASK_STATUS_OPTIONS.map((statusOption) => (
                      <Select.Option key={statusOption} value={statusOption}>
                        {getTaskStatusLabel(statusOption)}
                      </Select.Option>
                    ))}
                  </Select>
                </div>

                <div style={{ marginTop: 20 }}>
                  <h4>Assignees</h4>
                  <div style={{ marginBottom: 10 }}>
                    {localTask.assignees?.map((assignee) => (
                      <Tag
                        key={assignee.id}
                        closable
                        onClose={() => onRemoveAssignee(localTask.id, assignee.id)}
                        color="blue"
                        style={{ marginBottom: 4 }}
                      >
                        {assignee.username}
                      </Tag>
                    ))}
                  </div>
                  <Select
                    placeholder="选择执行者"
                    style={{ width: '100%', marginBottom: 8 }}
                    value={selectedAssigneeId}
                    onChange={(userId) => setSelectedAssigneeId(userId)}
                  >
                    {users
                      .filter((u) => !localTask.assignees?.some((a) => a.id === u.id))
                      .map((user) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.username}
                        </Select.Option>
                      ))}
                  </Select>
                  {selectedAssigneeId && (
                    <div>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          onAddAssignee(localTask.id, selectedAssigneeId, false);
                          setSelectedAssigneeId(null);
                        }}
                        style={{ marginRight: 8 }}
                      >
                        Add
                      </Button>
                      <Button size="small" onClick={() => setSelectedAssigneeId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10 }}>
                  <h4>Followers</h4>
                  <div style={{ marginBottom: 10 }}>
                    {localTask.followers?.map((follower) => (
                      <Tag
                        key={follower.id}
                        closable
                        onClose={() => onRemoveFollower(localTask.id, follower.id)}
                        style={{ marginBottom: 4 }}
                      >
                        {follower.username}
                      </Tag>
                    ))}
                  </div>
                  <Select
                    placeholder="选择关注者"
                    style={{ width: '100%', marginBottom: 8 }}
                    value={selectedFollowerId}
                    onChange={(userId) => setSelectedFollowerId(userId)}
                  >
                    {users
                      .filter((u) => !localTask.followers?.some((f) => f.id === u.id))
                      .map((user) => (
                        <Select.Option key={user.id} value={user.id}>
                          {user.username}
                        </Select.Option>
                      ))}
                  </Select>
                  {selectedFollowerId && (
                    <div>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          onAddFollower(localTask.id, selectedFollowerId);
                          setSelectedFollowerId(null);
                        }}
                        style={{ marginRight: 8 }}
                      >
                        Add
                      </Button>
                      <Button size="small" onClick={() => setSelectedFollowerId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 10, marginBottom: 20 }}>
                  <h4>Teams</h4>
                  <div style={{ marginBottom: 10 }}>
                    {localTask.teams?.map((team) => (
                      <Tag
                        key={team.id}
                        closable
                        onClose={() => onRemoveTeam(localTask.id, team.id)}
                        color="purple"
                        style={{ marginBottom: 4 }}
                      >
                        {team.name}
                      </Tag>
                    ))}
                  </div>
                  <Select
                    placeholder="选择团队"
                    style={{ width: '100%', marginBottom: 8 }}
                    value={selectedTeamId}
                    onChange={(teamId) => setSelectedTeamId(teamId)}
                  >
                    {teams
                      .filter((t) => !localTask.teams?.some((team) => team.id === t.id))
                      .map((team) => (
                        <Select.Option key={team.id} value={team.id}>
                          {team.name}
                        </Select.Option>
                      ))}
                  </Select>
                  {selectedTeamId && (
                    <div>
                      <Button
                        type="primary"
                        size="small"
                        onClick={() => {
                          onAddTeam(localTask.id, selectedTeamId);
                          setSelectedTeamId(null);
                        }}
                        style={{ marginRight: 8 }}
                      >
                        Add
                      </Button>
                      <Button size="small" onClick={() => setSelectedTeamId(null)}>
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <Form onFinish={onAddComment}>
                  <Form.Item name="content">
                    <TextArea rows={2} />
                  </Form.Item>
                  <Button type="primary" htmlType="submit">
                    Comment
                  </Button>
                </Form>
              </>
            ),
          },
          {
            key: 'history',
            label: '历史',
            children: (
              <div style={{ marginTop: 15 }}>
                <Timeline>
                  {history.map((h) => (
                    <Timeline.Item key={h.id} color="blue">
                      <b>{h.user?.username}</b>: {h.content} <br />
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {dayjs(h.createdAt).fromNow()}
                      </span>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

export default TaskDetailDrawer;

