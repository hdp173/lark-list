import React from 'react';
import { Modal, Form, Input, DatePicker, Select, Button } from 'antd';
import { User, Team } from './types';

const { TextArea } = Input;

interface CreateTaskModalProps {
  visible: boolean;
  users: User[];
  teams: Team[];
  onCancel: () => void;
  onSubmit: (values: any) => void;
  form: any;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  users,
  teams,
  onCancel,
  onSubmit,
  form,
}) => {
  return (
    <Modal
      title="New Task"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input placeholder="Enter task title" />
        </Form.Item>
        <Form.Item name="description" label="Description (Optional)">
          <TextArea rows={3} placeholder="Enter task description" />
        </Form.Item>
        <Form.Item name="dueDate" label="Due Date (Optional)">
          <DatePicker style={{ width: '100%' }} showTime />
        </Form.Item>
        <Form.Item name="assigneeIds" label="Assign To (Optional)">
          <Select
            mode="multiple"
            placeholder="Select assignees"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="followerIds" label="Followers (Optional)">
          <Select
            mode="multiple"
            placeholder="Select followers"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {users.map((user) => (
              <Select.Option key={user.id} value={user.id}>
                {user.username}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="teamIds" label="Teams (Optional)">
          <Select
            mode="multiple"
            placeholder="Select teams"
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {teams.map((team) => (
              <Select.Option key={team.id} value={team.id}>
                {team.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          Create Task
        </Button>
      </Form>
    </Modal>
  );
};

export default CreateTaskModal;

