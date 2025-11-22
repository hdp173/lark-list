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
      title="新建任务"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item name="title" label="标题" rules={[{ required: true }]}>
          <Input placeholder="输入任务标题" />
        </Form.Item>
        <Form.Item name="description" label="描述（可选）">
          <TextArea rows={3} placeholder="输入任务描述" />
        </Form.Item>
        <Form.Item name="dueDate" label="截止日期（可选）">
          <DatePicker style={{ width: '100%' }} showTime />
        </Form.Item>
        <Form.Item name="assigneeIds" label="指派给（可选）">
          <Select
            mode="multiple"
            placeholder="选择执行者"
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
        <Form.Item name="followerIds" label="关注者（可选）">
          <Select
            mode="multiple"
            placeholder="选择关注者"
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
        <Form.Item name="teamIds" label="团队（可选）">
          <Select
            mode="multiple"
            placeholder="选择团队"
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

