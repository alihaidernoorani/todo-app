/**
 * T019: Animated Checkbox Component - Clean Light Mode
 *
 * Interactive checkbox with spring animation for task completion.
 * Features:
 * - Framer Motion spring physics (stiffness: 300, damping: 20)
 * - Scale animation on check/uncheck
 * - Green accent for checked state (semantic success color)
 * - Blue accents for hover/focus (matches primary theme)
 * - Optimistic state support
 *
 * Design (Clean Light Mode):
 * - Unchecked: White background with slate-300 border
 * - Checked: Green-600 fill with white checkmark icon
 * - Pending: Blue-300 border with spinner
 * - Hover: Blue-500 border glow
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
        ${checked ? "bg-green-600 border-green-600" : "bg-white border-slate-300"}
        ${isPending ? "border-blue-300" : ""}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-blue-500"}
        focus-ring
      `}
    >
      {/* Checkmark */}
      {checked && !isPending && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.2, 1],
            opacity: 1,
            backgroundColor: ["transparent", "rgba(34, 197, 94, 0.2)", "transparent"] // Green pop effect
          }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 300,
              damping: 20,
            },
            backgroundColor: {
              duration: 0.3,
            }
          }}
          className="absolute inset-0 flex items-center justify-center rounded-full"
        >
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
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
            className="animate-spin h-3 w-3 text-blue-600"
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
