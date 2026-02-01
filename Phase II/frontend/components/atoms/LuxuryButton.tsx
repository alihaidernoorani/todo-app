/**
 * Luxury Button Component
 *
 * Premium button with glassmorphism and tactile effects.
 * Features:
 * - Glassmorphism background (bg-white/5)
 * - Hover effects (bg-white/10, border glow)
 * - Tactile press animation
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Icon support
 * - Loading states
 *
 * Design:
 * - Primary: Amber background with dark text
 * - Secondary: Glassmorphism with white text
 * - Danger: Red accent for destructive actions
 * - Ghost: Transparent with border only
 *
 * Usage:
 * ```tsx
 * <LuxuryButton variant="primary" onClick={handleSave}>
 *   Save Task
 * </LuxuryButton>
 *
 * <LuxuryButton variant="danger" icon={<Trash2 />} onClick={handleDelete}>
 *   Delete
 * </LuxuryButton>
 * ```
 */

"use client"

import { ReactNode, ButtonHTMLAttributes } from "react"

interface LuxuryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant
   */
  variant?: "primary" | "secondary" | "danger" | "ghost"

  /**
   * Icon element (displayed before text)
   */
  icon?: ReactNode

  /**
   * Loading state (shows spinner)
   */
  isLoading?: boolean

  /**
   * Full width button
   */
  fullWidth?: boolean

  /**
   * Button size
   */
  size?: "sm" | "md" | "lg"

  /**
   * Button content
   */
  children: ReactNode
}

const variantClasses = {
  primary:
    "bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold glow-amber-subtle",
  secondary:
    "bg-white/5 hover:bg-white/10 text-gray-100 border border-white/10 hover:border-white/20",
  danger:
    "bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 hover:border-red-500/50",
  ghost:
    "bg-transparent hover:bg-white/5 text-gray-300 border border-transparent hover:border-white/10",
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
}

export function LuxuryButton({
  variant = "secondary",
  icon,
  isLoading = false,
  fullWidth = false,
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: LuxuryButtonProps) {
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]

  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl
        transition-all duration-200 tactile-button shadow-2xl
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible-ring
        ${variantClass}
        ${sizeClass}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading Spinner */}
      {isLoading ? (
        <svg
          className="animate-spin h-4 w-4"
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
      ) : (
        icon
      )}

      {/* Button Text */}
      <span>{children}</span>
    </button>
  )
}

/**
 * Icon-only button variant
 */
export function IconButton({
  icon,
  ariaLabel,
  variant = "ghost",
  size = "md",
  ...props
}: Omit<LuxuryButtonProps, "children"> & { ariaLabel: string }) {
  return (
    <button
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center rounded-xl
        transition-all duration-200 tactile-button shadow-2xl
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible-ring
        ${variantClasses[variant]}
        ${size === "sm" ? "w-8 h-8" : size === "md" ? "w-9 h-9" : "w-10 h-10"}
      `}
      {...props}
    >
      {icon}
    </button>
  )
}
