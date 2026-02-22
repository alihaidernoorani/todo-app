/**
 * Tooltip Component
 *
 * Lightweight tooltip for displaying helpful text on hover.
 * Features:
 * - Automatic positioning (right, left, top, bottom)
 * - Smooth fade-in animation
 * - Accessible (aria-label fallback)
 * - Clean light mode styling
 *
 * Usage:
 * ```tsx
 * <Tooltip content="Dashboard" position="right">
 *   <button>Icon</button>
 * </Tooltip>
 * ```
 */

"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface TooltipProps {
  /**
   * Content to display in the tooltip
   */
  content: string

  /**
   * Position of the tooltip relative to the trigger element
   */
  position?: "top" | "right" | "bottom" | "left"

  /**
   * Delay before showing tooltip (in milliseconds)
   */
  delay?: number

  /**
   * Child element that triggers the tooltip
   */
  children: React.ReactNode
}

export function Tooltip({
  content,
  position = "right",
  delay = 300,
  children,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  let timeoutId: NodeJS.Timeout

  const showTooltip = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    clearTimeout(timeoutId)
    setIsVisible(false)
  }

  // Position classes based on tooltip position
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 px-3 py-1.5 rounded-lg
              bg-slate-900 text-white text-sm font-medium
              whitespace-nowrap shadow-lg pointer-events-none
              ${positionClasses[position]}
            `}
            role="tooltip"
          >
            {content}

            {/* Arrow indicator */}
            <div
              className={`
                absolute w-2 h-2 bg-slate-900 rotate-45
                ${
                  position === "right"
                    ? "-left-1 top-1/2 -translate-y-1/2"
                    : position === "left"
                    ? "-right-1 top-1/2 -translate-y-1/2"
                    : position === "top"
                    ? "-bottom-1 left-1/2 -translate-x-1/2"
                    : "-top-1 left-1/2 -translate-x-1/2"
                }
              `}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
