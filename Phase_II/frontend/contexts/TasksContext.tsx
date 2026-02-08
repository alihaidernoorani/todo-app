"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import type { TaskRead } from '@/lib/api/types'

interface TasksContextType {
  tasks: TaskRead[]
  addTask: (task: TaskRead) => void
  updateTask: (taskId: string, updates: Partial<TaskRead>) => void
  deleteTask: (taskId: string) => void
  setTasks: (tasks: TaskRead[]) => void
}

const TasksContext = createContext<TasksContextType | undefined>(undefined)

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<TaskRead[]>([])

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

  const value = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    setTasks
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
