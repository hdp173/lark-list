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
        message.success('登录成功');
        navigate('/dashboard');
      } else {
        message.success('注册成功，请登录');
        setIsRegister(false);
        form.resetFields();
      }
    } catch (e) {
      message.error('认证失败');
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
            任务管理系统
          </Title>
          <Text type="secondary">
            {isRegister ? '创建新账户' : '登录您的账户'}
          </Text>
        </div>
        <Form form={form} onFinish={handleSubmit} layout="vertical" autoComplete="off">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名！' }]}
          >
            <Input size="large" placeholder="输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码！' },
              { min: 6, message: '密码至少6个字符！' },
            ]}
          >
            <Input.Password size="large" placeholder="输入密码" />
          </Form.Item>
          {isRegister && (
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码！' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致！'));
                  },
                }),
              ]}
            >
              <Input.Password size="large" placeholder="确认密码" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              {isRegister ? '注册' : '登录'}
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
              {isRegister ? '已有账户？立即登录' : '没有账户？立即注册'}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;

