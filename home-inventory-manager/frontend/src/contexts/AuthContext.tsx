import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

interface User {
  user_id: number
  username: string
  token: string
}

interface AuthState {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<string | null>
  register: (username: string, password: string) => Promise<string | null>
  logout: () => void
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  login: async () => null,
  register: async () => null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 启动时从 localStorage 恢复登录状态
  useEffect(() => {
    const saved = localStorage.getItem('user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setUser(parsed)
        // 验证 token 是否还有效
        api.get('/auth/me', {
          headers: { Authorization: `Bearer ${parsed.token}` },
        }).then(res => {
          if (!res.data.success) {
            localStorage.removeItem('user')
            setUser(null)
          }
        }).catch(() => {
          localStorage.removeItem('user')
          setUser(null)
        })
      } catch {
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await api.post('/auth/login', { username, password })
      if (res.data.success) {
        const u = res.data.data
        localStorage.setItem('user', JSON.stringify(u))
        setUser(u)
        return null
      }
      return res.data.error || '登录失败'
    } catch (e: any) {
      return e?.response?.data?.error || '登录失败'
    }
  }, [])

  const register = useCallback(async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await api.post('/auth/register', { username, password })
      if (res.data.success) {
        const u = res.data.data
        localStorage.setItem('user', JSON.stringify(u))
        setUser(u)
        return null
      }
      return res.data.error || '注册失败'
    } catch (e: any) {
      return e?.response?.data?.error || '注册失败'
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
