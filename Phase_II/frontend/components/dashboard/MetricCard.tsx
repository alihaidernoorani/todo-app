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
    bg: "bg-amber-100",
    border: "border-amber-200",
    icon: "text-amber-600",
    hover: "hover:shadow-md hover:border-amber-300",
  },
  emerald: {
    bg: "bg-emerald-100",
    border: "border-emerald-200",
    icon: "text-emerald-600",
    hover: "hover:shadow-md hover:border-emerald-300",
  },
  blue: {
    bg: "bg-blue-100",
    border: "border-blue-200",
    icon: "text-blue-600",
    hover: "hover:shadow-md hover:border-blue-300",
  },
  purple: {
    bg: "bg-purple-100",
    border: "border-purple-200",
    icon: "text-purple-600",
    hover: "hover:shadow-md hover:border-purple-300",
  },
  red: {
    bg: "bg-red-100",
    border: "border-red-200",
    icon: "text-red-600",
    hover: "hover:shadow-md hover:border-red-300",
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
      className={`bg-white rounded-xl border border-slate-200 min-h-[132px] transition-all duration-200 ${colors.hover} cursor-default group shadow-sm overflow-hidden`}
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
          className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight tabular-nums leading-none truncate w-full"
          aria-label={`${label}: ${formatted.full}`}
        >
          {formatted.display}
        </p>

        {/* Label */}
        <p className="text-xs md:text-sm font-medium text-slate-500 tracking-wide uppercase truncate w-full">
          {label}
        </p>
      </div>
    </motion.div>
  )
}
