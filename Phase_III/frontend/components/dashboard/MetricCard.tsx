"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"
import { formatNumber } from "@/lib/utils/formatNumber"

interface MetricCardProps {
  icon: ReactNode
  label: string
  value: number
  color: "amber" | "emerald" | "blue" | "purple" | "red"
  index?: number
}

const colorClasses = {
  amber: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    hover: "hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700",
  },
  emerald: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    hover: "hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  blue: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    hover: "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700",
  },
  purple: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    border: "border-purple-200 dark:border-purple-800",
    icon: "text-purple-600 dark:text-purple-400",
    hover: "hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700",
  },
  red: {
    bg: "bg-red-100 dark:bg-red-900/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    hover: "hover:shadow-md hover:border-red-300 dark:hover:border-red-700",
  },
}

export function MetricCard({ icon, label, value, color, index = 0 }: MetricCardProps) {
  const colors = colorClasses[color]
  const formatted = formatNumber(value)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[132px] transition-all duration-200 ${colors.hover} cursor-default group shadow-sm overflow-hidden`}
    >
      <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex flex-col items-center justify-center text-center h-full">
        {/* Icon */}
        <div
          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}
        >
          <div className={`w-5 h-5 md:w-6 md:h-6 ${colors.icon}`}>{icon}</div>
        </div>

        {/* Value */}
        <p
          className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-50 tracking-tight tabular-nums leading-none truncate w-full"
          aria-label={`${label}: ${formatted.full}`}
        >
          {formatted.display}
        </p>

        {/* Label */}
        <p className="text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide uppercase truncate w-full">
          {label}
        </p>
      </div>
    </motion.div>
  )
}
