/**
 * Toast Notification Component
 *
 * Subtle success/info toast for user feedback.
 * Features:
 * - Auto-dismiss after 2 seconds
 * - Slide-in animation from top
 * - Success (green) variant
 * - Clean light mode styling
 * - Non-intrusive positioning
 *
 * Usage:
 * ```tsx
 * <Toast
 *   message="Task created successfully"
 *   variant="success"
 *   onClose={() => setShowToast(false)}
 * />
 * ```
 */

"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, X } from "lucide-react"

interface ToastProps {
  /**
   * Toast message
   */
  message: string

  /**
   * Visual variant
   */
  variant?: "success" | "info"

  /**
   * Close callback
   */
  onClose: () => void

  /**
   * Auto-dismiss duration (ms)
   */
  duration?: number

  /**
   * Whether to show the toast
   */
  show?: boolean
}

export function Toast({
  message,
  variant = "success",
  onClose,
  duration = 2000,
  show = true,
}: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [show, duration, onClose])

  const variantStyles = {
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-700",
      icon: <CheckCircle className="w-5 h-5 text-blue-600" />,
    },
  }

  const style = variantStyles[variant]

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full mx-4"
        >
          <div
            className={`
              ${style.bg} ${style.border} border rounded-lg shadow-lg
              px-4 py-3 flex items-center gap-3
            `}
          >
            {style.icon}
            <p className={`flex-1 text-sm font-medium ${style.text}`}>
              {message}
            </p>
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-white/50 ${style.text} transition-colors`}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
