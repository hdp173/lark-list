import React from 'react';
import { Modal, Form, Input, Select, Button } from 'antd';
import { User } from './types';

const { TextArea } = Input;

interface CreateTeamModalProps {
  visible: boolean;
  users: User[];
  onCancel: () => void;
  onSubmit: (values: any) => void;
  form: any;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  visible,
  users,
  onCancel,
  onSubmit,
  form,
}) => {
  return (
    <Modal
      title="New Team"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item name="name" label="团队名称" rules={[{ required: true }]}>
          <Input placeholder="输入团队名称" />
        </Form.Item>
        <Form.Item name="description" label="Description (Optional)">
          <TextArea rows={3} placeholder="输入团队描述" />
        </Form.Item>
        <Form.Item name="memberIds" label="Members (Optional)">
          <Select
            mode="multiple"
            placeholder="Select team members"
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
        <Button type="primary" htmlType="submit" block>
          Create Team
        </Button>
      </Form>
    </Modal>
  );
};

export default CreateTeamModal;

