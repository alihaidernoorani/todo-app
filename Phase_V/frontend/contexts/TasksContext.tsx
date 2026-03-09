"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import type { TaskRead } from '@/lib/api/types'

interface TasksContextType {
  tasks: TaskRead[]
  addTask: (task: TaskRead) => void
  updateTask: (taskId: string, updates: Partial<TaskRead>) => void
  deleteTask: (taskId: string) => void
  setTasks: (tasks: TaskRead[]) => void
  refreshKey: number
  triggerRefresh: () => void
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskRead[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const addTask = useCallback((task: TaskRead) => {
    setTasks(prevTasks => [...prevTasks, task])
  }, [])

  const updateTask = useCallback((taskId: string, updates: Partial<TaskRead>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, ...updates } : task
      )
    )
  }, [])

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
  }, [])

  // SSE subscription for real-time task updates (T076)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const es = new EventSource('/api/tasks/stream', { withCredentials: true })

    es.addEventListener('task.instance_created', () => {
      triggerRefresh()
    })

    es.addEventListener('task.status_changed', () => {
      triggerRefresh()
    })

    es.onerror = (err) => {
      console.warn('[SSE] Connection error, will auto-reconnect:', err)
    }

    return () => {
      es.close()
    }
  }, [triggerRefresh])

  const value = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setTasks,
    refreshKey,
    triggerRefresh,
  }

  return (
    <TasksContext.Provider value={value}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (context === undefined) {
    throw new Error('useTasks must be used within a TasksProvider')
  }
  return context
}
