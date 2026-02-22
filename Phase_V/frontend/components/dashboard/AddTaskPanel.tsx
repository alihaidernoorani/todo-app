"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Sparkles } from 'lucide-react'
import { useTasks } from '@/contexts/TasksContext'
import { createTask } from '@/lib/api/tasks'

export function AddTaskPanel() {
  const { triggerRefresh } = useTasks()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await createTask({
      title: title.trim(),
      description: description.trim() || null,
      priority,
    })

    if (result.success) {
      setTitle('')
      setDescription('')
      setPriority('Medium')
      triggerRefresh()
    } else {
      setError(result.error.message)
    }

    setIsSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-24"
    >
      {/* Add Task Form Card */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50/30 to-blue-50 dark:from-slate-800 dark:via-slate-800/50 dark:to-slate-800 rounded-2xl border-2 border-blue-200/50 dark:border-slate-600/50 shadow-lg p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">
              Quick Add
            </h3>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Create a new task
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div>
            <label htmlFor="task-title" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2.5">
              Task Title *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full px-5 py-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none text-lg text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              required
            />
          </div>

          {/* Description Input */}
          <div>
            <label htmlFor="task-description" className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-2.5">
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="w-full px-5 py-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none text-lg text-slate-900 dark:text-slate-50 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
            />
          </div>

          {/* Priority Selector */}
          <div>
            <label className="block text-base font-semibold text-slate-700 dark:text-slate-200 mb-3">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {(['Low', 'Medium', 'High'] as const).map((priorityOption) => (
                <button
                  key={priorityOption}
                  type="button"
                  onClick={() => setPriority(priorityOption)}
                  className={`px-2 sm:px-4 md:px-5 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all ${
                    priority === priorityOption
                      ? priorityOption === 'High'
                        ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 shadow-sm'
                        : priorityOption === 'Medium'
                        ? 'bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-300 shadow-sm'
                        : 'bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  {priorityOption}
                </button>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
          >
            <Plus className="w-6 h-6" />
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </button>
        </form>

        {/* Quick Tips */}
        <div className="mt-6 pt-6 border-t border-blue-200/50 dark:border-slate-600/50">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2.5">Quick tips:</p>
          <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <li>• Use descriptive titles for clarity</li>
            <li>• Set priorities to stay focused</li>
            <li>• Add details to track progress</li>
          </ul>
        </div>
      </div>
    </motion.div>
  )
}

// Add CSS animations for entrance
const styles = `
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}