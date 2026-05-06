import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api'

interface Category {
  id: number
  name: string
}

interface AppState {
  categories: Category[]
  reminderDays: number
  fontSize: string
  refresh: () => void
}

const defaultState: AppState = {
  categories: [],
  reminderDays: 7,
  fontSize: 'normal',
  refresh: () => {},
}

const AppContext = createContext<AppState>(defaultState)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([])
  const [reminderDays, setReminderDays] = useState(7)
  const [fontSize, setFontSize] = useState('normal')
  const [tick, setTick] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [catRes, setRes] = await Promise.all([
        api.get('/categories'),
        api.get('/settings'),
      ])
      if (catRes.data.success) setCategories(catRes.data.data)
      if (setRes.data.success) {
        setReminderDays(Number(setRes.data.data.reminder_days) || 7)
        const fs = setRes.data.data.font_size || 'normal'
        setFontSize(fs)
        document.documentElement.setAttribute('data-font-size', fs)
      }
    } catch (e) {
      console.error('Failed to load app data', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData, tick])

  const refresh = useCallback(() => setTick(t => t + 1), [])

  return (
    <AppContext.Provider value={{ categories, reminderDays, fontSize, refresh }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppContext() {
  return useContext(AppContext)
}
