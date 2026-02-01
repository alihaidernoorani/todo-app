/**
 * Animated Checkbox Component
 *
 * Interactive checkbox with spring animation for task completion.
 * Features:
 * - Framer Motion spring physics (stiffness: 300, damping: 20)
 * - Scale animation on check/uncheck
 * - Emerald accent for checked state
 * - Glassmorphism border
 * - Optimistic state support
 *
 * Design:
 * - Unchecked: Ghost border (white/10)
 * - Checked: Emerald fill with checkmark icon
 * - Pending: Amber border with spinner
 * - Hover: Border glow effect
 *
 * Usage:
 * ```tsx
 * <AnimatedCheckbox
 *   checked={task.is_completed}
 *   onChange={() => toggleComplete(task.id)}
 *   isPending={task._optimistic}
 * />
 * ```
 */

"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"

interface AnimatedCheckboxProps {
  /**
   * Checked state
   */
  checked: boolean

  /**
   * Change handler
   */
  onChange: () => void

  /**
   * Disabled state (e.g., during API call)
   */
  disabled?: boolean

  /**
   * Optimistic state (shows pending indicator)
   */
  isPending?: boolean

  /**
   * Accessible label for screen readers
   */
  ariaLabel?: string
}

export function AnimatedCheckbox({
  checked,
  onChange,
  disabled = false,
  isPending = false,
  ariaLabel = "Toggle task completion",
}: AnimatedCheckboxProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-checked={checked}
      role="checkbox"
      className={`
        relative w-5 h-5 rounded border transition-all duration-200
        ${checked ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5 border-white/10"}
        ${isPending ? "border-amber-500/50" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-emerald-500/30"}
        focus-visible-ring
      `}
    >
      {/* Checkmark */}
      {checked && !isPending && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 20,
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Check className="w-4 h-4 text-emerald-400" strokeWidth={3} />
        </motion.div>
      )}

      {/* Pending Spinner */}
      {isPending && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <svg
            className="animate-spin h-3 w-3 text-amber-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </motion.div>
      )}
    </button>
  )
}
