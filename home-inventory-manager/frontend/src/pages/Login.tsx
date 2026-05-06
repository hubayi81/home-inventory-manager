import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Tabs, App } from 'antd'
import { UserOutlined, LockOutlined, HomeOutlined, KeyOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

export default function Login() {
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const handleSubmit = async (values: { username: string; password: string; code?: string }) => {
    setLoading(true)
    const error = activeTab === 'login'
      ? await login(values.username, values.password)
      : await register(values.username, values.password, values.code || '')
    setLoading(false)

    if (error) {
      message.error(error)
    } else {
      message.success(activeTab === 'login' ? '登录成功，欢迎回家~' : '注册成功，欢迎加入~')
      navigate('/')
    }
  }

  return (
    <div style={styles.container}>
      {/* 装饰浮动元素 */}
      <div style={styles.bubble1} />
      <div style={styles.bubble2} />
      <div style={styles.bubble3} />

      <Card style={styles.card} bodyStyle={{ padding: '40px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <HomeOutlined style={{ fontSize: 48, color: '#FF9A76' }} />
          <Title level={2} style={{ marginTop: 12, color: '#5C4033', marginBottom: 4 }}>
            家庭物品管家
          </Title>
          <Text type="secondary" style={{ fontSize: 15 }}>
            用心管理，温暖生活
          </Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            { key: 'login', label: '登录' },
            { key: 'register', label: '注册' },
          ]}
        />

        <Form onFinish={handleSubmit} size="large" style={{ marginTop: 8 }}>
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined style={{ color: '#ccc' }} />} placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }, { min: 4, message: '密码至少4位' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#ccc' }} />} placeholder="密码" />
          </Form.Item>
          {activeTab === 'register' && (
            <Form.Item name="code" rules={[{ required: true, message: '请输入邀请码' }]}>
              <Input prefix={<KeyOutlined style={{ color: '#ccc' }} />} placeholder="邀请码（由管理员提供）" />
            </Form.Item>
          )}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block
              style={{
                height: 44,
                fontSize: 16,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #FF9A76, #fec89a)',
                border: 'none',
              }}>
              {activeTab === 'login' ? '登录' : '注册'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8D6 30%, #FDE2E4 60%, #FADADD 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    width: 400,
    borderRadius: 20,
    boxShadow: '0 8px 40px rgba(255, 154, 118, 0.2)',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    zIndex: 1,
  },
  bubble1: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: '50%',
    background: 'rgba(255, 154, 118, 0.15)',
    top: '-50px', left: '-50px',
  },
  bubble2: {
    position: 'absolute',
    width: 150, height: 150,
    borderRadius: '50%',
    background: 'rgba(168, 216, 185, 0.2)',
    bottom: '10%', right: '5%',
  },
  bubble3: {
    position: 'absolute',
    width: 100, height: 100,
    borderRadius: '50%',
    background: 'rgba(255, 232, 192, 0.3)',
    top: '60%', left: '10%',
  },
}
