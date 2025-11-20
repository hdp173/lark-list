// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Layout, message, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { taskApi, userApi } from '../api';
import Header from '../components/Header';
import { Task, User } from '../components/types';

const { Content } = Layout;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchTasks();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await userApi.getCurrentUser();
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Failed to fetch current user', error);
      message.error('Failed to load user information');
      navigate('/login');
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskApi.getTasks({});
      setTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header currentUser={currentUser} onLogout={handleLogout} />
      <Content style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <div>
            <h2>Tasks ({tasks.length})</h2>
            {tasks.map((task) => (
              <div key={task.id} style={{ padding: '10px', border: '1px solid #ddd', margin: '10px 0' }}>
                <h3>{task.title}</h3>
                <p>Status: {task.status}</p>
              </div>
            ))}
          </div>
        )}
      </Content>
    </Layout>
  );
};

export default Dashboard;
