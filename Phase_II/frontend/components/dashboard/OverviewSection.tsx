"use client"

import { motion } from 'framer-motion'
import { MetricsGrid } from './MetricsGrid'
import { TaskStream } from './TaskStream'
import { useTasks } from '@/contexts/TasksContext'
import type { TaskRead } from '@/lib/api/types'

export function OverviewSection() {
  const { tasks, setTasks } = useTasks()

  // Handle task changes from TaskStream and update context
  const handleTasksChange = (updatedTasks: TaskRead[]) => {
    setTasks(updatedTasks)
  }

  return (
    <>
      {/* Metrics Grid Section */}
      <motion.section
        aria-labelledby="metrics-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2 id="metrics-heading" className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-200 mb-5">
          System Status
        </h2>
        <MetricsGrid tasks={tasks} />
      </motion.section>

      {/* Task Stream Section */}
      <motion.section
        aria-labelledby="tasks-heading"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mt-6"
      >
        <h2 id="tasks-heading" className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-200 mb-5">
          Active Tasks
        </h2>
        <TaskStream onTasksChange={handleTasksChange} />
      </motion.section>
    </>
  )
}

// Add CSS animations for entrance
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}