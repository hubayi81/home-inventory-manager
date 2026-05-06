import React, { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, Button, Dropdown, Space, Avatar, Tooltip } from 'antd'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  PlusCircleOutlined,
  ShoppingCartOutlined,
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  FontSizeOutlined,
  BellOutlined,
} from '@ant-design/icons'
import api from '../api'
import { useAuth } from '../contexts/AuthContext'
import { useAppContext } from '../contexts/AppContext'

const { Sider, Content, Header } = Layout
const { Title, Text } = Typography

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '仪表板' },
  { key: '/items', icon: <UnorderedListOutlined />, label: '全部库存' },
  { key: '/add', icon: <PlusCircleOutlined />, label: '添加物品' },
  { key: '/shopping-list', icon: <ShoppingCartOutlined />, label: '购物清单' },
  { key: '/settings', icon: <SettingOutlined />, label: '设置' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuth()
  const { fontSize, refresh } = useAppContext()

  const selectedKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]

  const cycleFontSize = async () => {
    const next: Record<string, string> = { normal: 'large', large: 'xlarge', xlarge: 'normal' }
    const fs = next[fontSize] || 'normal'
    document.documentElement.setAttribute('data-font-size', fs)
    await api.put('/settings', { font_size: fs })
    refresh()
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout },
    ],
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: 'linear-gradient(180deg, #FFF5EE 0%, #FFF0E6 100%)',
          borderRight: '1px solid #FFE8D6',
          position: 'relative',
          overflow: 'hidden',
        }}
        width={220}
      >
        <div style={{
          padding: '20px 16px',
          textAlign: 'center',
          borderBottom: '1px solid #FFE8D6',
          marginBottom: 8,
        }}>
          <HomeOutlined style={{ fontSize: collapsed ? 24 : 20, color: '#FF9A76' }} />
          {!collapsed && (
            <Title level={4} style={{ color: '#5C4033', margin: '8px 0 0', fontSize: 17 }}>
              家庭物品管家
            </Title>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{
            background: 'transparent',
            borderRight: 'none',
            fontSize: 15,
          }}
        />
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            textAlign: 'center',
            padding: '16px 12px',
          }}>
            <div style={{
              fontSize: 32,
              marginBottom: 6,
              opacity: 0.6,
            }}>
              🏡
            </div>
            <Text style={{
              fontSize: 11,
              color: '#B8A090',
              lineHeight: 1.5,
            }}>
              温暖的家
              <br />
              从整理开始
            </Text>
          </div>
        )}
      </Sider>
      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid #FFE8D6',
          height: 56,
        }}>
          <Tooltip title="开启过期提醒">
            <Button
              icon={<BellOutlined />}
              onClick={() => navigate('/settings')}
              shape="circle"
              type="text"
              style={{ color: '#8B7355', fontSize: 18 }}
            />
          </Tooltip>
          <Tooltip title={`字号: ${fontSize === 'normal' ? '标准' : fontSize === 'large' ? '大' : '超大'}`}>
            <Button
              icon={<FontSizeOutlined />}
              onClick={cycleFontSize}
              shape="circle"
              type="text"
              style={{ color: '#8B7355', fontSize: 18 }}
            />
          </Tooltip>
          <Dropdown menu={userMenu} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ background: '#FF9A76' }} />
              <Text strong style={{ color: '#5C4033' }}>{user?.username}</Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{
          margin: 24,
          padding: 24,
          background: '#fff',
          borderRadius: 16,
          minHeight: 360,
          boxShadow: '0 2px 12px rgba(255, 154, 118, 0.08)',
        }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
