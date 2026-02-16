"use client"

import { MetricCard } from "./MetricCard"
import type { TaskRead } from "@/lib/api/types"
import {
  CheckCircle,
  Clock,
  ListTodo,
} from "lucide-react"

interface MetricsGridProps {
  /**
   * Task list to calculate metrics from (client-side calculation)
   */
  tasks: TaskRead[]
}

export function MetricsGrid({ tasks }: MetricsGridProps) {
  // Calculate metrics client-side from task list
  const total = tasks.length
  const completed = tasks.filter(task => task.is_completed).length
  const pending = total - completed

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 overflow-x-hidden">
      <MetricCard
        icon={<ListTodo />}
        label="Total Tasks"
        value={total}
        color="blue"
        index={0}
      />

      <MetricCard
        icon={<CheckCircle />}
        label="Completed"
        value={completed}
        color="emerald"
        index={1}
      />

      <MetricCard
        icon={<Clock />}
        label="In Progress"
        value={pending}
        color="amber"
        index={2}
      />
    </div>
  )
}
