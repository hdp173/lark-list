import React from 'react';
import { Layout, Button } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { User } from './types';

const { Header: AntHeader } = Layout;

interface HeaderProps {
  currentUser: User | null;
  onNewTask: () => void;
  onNewTeam: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onNewTask, onNewTeam, onLogout }) => {
  return (
    <AntHeader
      style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 20px' }}
    >
      <h2 style={{ margin: 0 }}>任务管理系统</h2>
      <div style={{ flex: 1 }} />
      <Button
        style={{ marginRight: 10 }}
        icon={<PlusOutlined />}
        onClick={onNewTeam}
      >
        新建团队
      </Button>
      <Button type="primary" icon={<PlusOutlined />} onClick={onNewTask}>
        新建任务
      </Button>
      {currentUser && (
        <span style={{ marginLeft: 16, color: '#666' }}>
          <UserOutlined /> {currentUser.username}
        </span>
      )}
      <Button style={{ marginLeft: 10 }} onClick={onLogout}>
        退出登录
      </Button>
    </AntHeader>
  );
};

export default Header;

