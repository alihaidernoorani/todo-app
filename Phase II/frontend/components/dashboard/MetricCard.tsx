/**
 * Metric Card Component
 *
 * Displays a single metric with icon, label, and value.
 * Features:
 * - Glassmorphism styling with ghost borders
 * - Icon with colored background
 * - Large value display with gradient text
 * - Staggered entry animation via Framer Motion
 *
 * Design:
 * - Follows Midnight Stone aesthetic
 * - Hover effects with border glow
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
    bg: "bg-amber-500/20",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    glow: "hover:shadow-neon-amber",
  },
  emerald: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    glow: "hover:shadow-neon-emerald",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    glow: "hover:shadow-neon-cyan",
  },
  purple: {
    bg: "bg-purple-500/20",
    border: "border-purple-500/30",
    icon: "text-purple-400",
    glow: "hover:shadow-neon-purple",
  },
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500/30",
    icon: "text-red-400",
    glow: "hover:shadow-neon-red",
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
      className={`glass-card border-ghost-amber h-32 transition-all duration-300 ${colors.glow} hover:border-${color}-500/20 cursor-default group`}
    >
      <div className="space-y-3">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
        >
          <div className={`w-6 h-6 ${colors.icon}`}>{icon}</div>
        </div>

        {/* Label */}
        <p className="text-sm font-medium text-gray-400 tracking-wide uppercase">
          {label}
        </p>

        {/* Value */}
        <p className="text-3xl font-bold text-gray-100 font-mono tracking-tight">
          {value.toLocaleString()}
        </p>
      </div>

      {/* Hover indicator (subtle bottom glow) */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-${color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />
    </motion.div>
  )
}
