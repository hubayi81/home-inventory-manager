import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, Spin } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AppProvider } from './contexts/AppContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Items from './pages/Items'
import AddItem from './pages/AddItem'
import ShoppingList from './pages/ShoppingList'
import Settings from './pages/Settings'
import Login from './pages/Login'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <ProtectedRoute>
          <AppProvider>
            <Layout />
          </AppProvider>
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="items" element={<Items />} />
        <Route path="add" element={<AddItem />} />
        <Route path="shopping-list" element={<ShoppingList />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

// 暖色主题配置
const themeToken = {
  colorPrimary: '#FF9A76',
  colorSuccess: '#A8D8B9',
  colorWarning: '#FAD02C',
  colorError: '#FF7675',
  colorInfo: '#74B9FF',
  borderRadius: 12,
  colorBgContainer: '#fff',
  fontFamily: '"Noto Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN} theme={{ token: themeToken }}>
      <AntdApp>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </AntdApp>
    </ConfigProvider>
  )
}
