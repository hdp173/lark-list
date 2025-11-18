import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, Card, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to dashboard if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const apiCall = isRegister ? authApi.register : authApi.login;
      // Remove confirmPassword from payload before sending to API
      const { confirmPassword, ...apiData } = values;
      const res = await apiCall(apiData);
      if (!isRegister) {
        localStorage.setItem('token', res.data.access_token);
        localStorage.setItem('username', values.username);
        message.success('Login success');
        navigate('/dashboard');
      } else {
        message.success('Register success, please login');
        setIsRegister(false);
        form.resetFields();
      }
    } catch (e) {
      message.error('Auth failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          borderRadius: 8,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            Todo List
          </Title>
          <Text type="secondary">
            {isRegister ? 'Create an account' : 'Sign in to your account'}
          </Text>
        </div>
        <Form form={form} onFinish={handleSubmit} layout="vertical" autoComplete="off">
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input size="large" placeholder="Enter your username" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password size="large" placeholder="Enter your password" />
          </Form.Item>
          {isRegister && (
            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="Confirm your password" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {isRegister ? 'Sign Up' : 'Sign In'}
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Button
              type="link"
              onClick={() => {
                setIsRegister(!isRegister);
                form.resetFields();
              }}
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

