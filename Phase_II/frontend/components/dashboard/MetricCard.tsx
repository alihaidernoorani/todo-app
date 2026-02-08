/**
 * Metric Card Component
 *
 * Displays a single metric with icon, label, and value.
 * Features:
 * - Clean light mode styling with subtle shadows
 * - Icon with colored background
 * - Large value display with tech blue accents
 * - Staggered entry animation via Framer Motion
 *
 * Design:
 * - Follows "Slate & Snow" aesthetic
 * - Hover effects with subtle shadow enhancement
 * - Responsive sizing
 * - Zero layout shift (fixed dimensions)
 *
 * Usage:
 * ```tsx
 * <MetricCard
 *   icon={<CheckCircleIcon />}
 *   label="Completed"
 *   value={30}
 *   color="emerald"
 *   index={0}
 * />
 * ```
 */

"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface MetricCardProps {
  /**
   * Icon element (Lucide React icon or SVG)
   */
  icon: ReactNode

  /**
   * Metric label (e.g., "Total Tasks", "Completed")
   */
  label: string

  /**
   * Numeric value to display
   */
  value: number

  /**
   * Color theme for icon background and accents
   */
  color: "amber" | "emerald" | "blue" | "purple" | "red"

  /**
   * Index for staggered animation delay
   * Delay = index * 0.1s
   */
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1], // Custom ease for smooth spring-like motion
      }}
      className={`bg-white rounded-lg border border-slate-200 h-32 transition-all duration-200 ${colors.hover} cursor-default group shadow-sm`}
    >
      {/* FR-008a: Generous spacing - p-5 to p-6 for cards (20-24px) */}
      <div className="p-5 md:p-6 space-y-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
        >
          <div className={`w-6 h-6 ${colors.icon}`}>{icon}</div>
        </div>

        {/* Label */}
        {/* FR-009b: Responsive typography */}
        <p className="text-xs md:text-sm font-medium text-slate-600 tracking-wide uppercase">
          {label}
        </p>

        {/* Value */}
        <p className="text-2xl md:text-3xl font-bold text-slate-900 font-mono tracking-tight">
          {value.toLocaleString()}
        </p>
      </div>
    </motion.div>
  )
}
