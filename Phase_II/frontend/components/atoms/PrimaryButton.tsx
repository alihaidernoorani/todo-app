/**
 * T016-T017: PrimaryButton Component - Clean Light Mode
 *
 * Professional button component with light theme styling.
 * Features:
 * - Clean Light Mode design (blue-600 primary, white secondary)
 * - Smooth transitions and hover effects
 * - Multiple variants (primary, secondary, danger, ghost)
 * - Icon support
 * - Loading states
 * - Accessible focus states
 *
 * Design (Clean Light Mode):
 * - Primary: Blue background (#2563eb) with white text
 * - Secondary: White background with slate border
 * - Danger: Red accent for destructive actions
 * - Ghost: Transparent with hover background
 *
 * Usage:
 * ```tsx
 * <PrimaryButton variant="primary" onClick={handleSave}>
 *   Save Task
 * </PrimaryButton>
 *
 * <PrimaryButton variant="danger" icon={<Trash2 />} onClick={handleDelete}>
 *   Delete
 * </PrimaryButton>
 * ```
 */

"use client"

import { ReactNode, ButtonHTMLAttributes } from "react"

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
    "bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm hover:shadow-md",
  secondary:
    "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 shadow-sm",
  danger:
    "bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm hover:shadow-md",
  ghost:
    "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900",
}

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
}

export function PrimaryButton({
  variant = "secondary",
  icon,
  isLoading = false,
  fullWidth = false,
  size = "md",
  children,
  className = "",
  disabled,
  ...props
}: PrimaryButtonProps) {
  const variantClass = variantClasses[variant]
  const sizeClass = sizeClasses[size]

  return (
    <button
      className={`
        relative inline-flex items-center justify-center gap-2 rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-ring
        ${variantClass}
        ${sizeClass}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Loading Spinner - Absolute positioned to prevent layout shift */}
      {isLoading && (
        <svg
          className="absolute left-1/2 -translate-x-1/2 animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
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
      )}

      {/* Icon - Hidden during loading to prevent overlap */}
      {icon && !isLoading && (
        <span aria-hidden="true">{icon}</span>
      )}

      {/* Button Text - Made invisible during loading to maintain width */}
      <span className={isLoading ? "opacity-0" : ""}>
        {children}</span>
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
}: Omit<PrimaryButtonProps, "children"> & { ariaLabel: string }) {
  return (
    <button
      aria-label={ariaLabel}
      className={`
        inline-flex items-center justify-center rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-ring
        ${variantClasses[variant]}
        ${size === "sm" ? "w-8 h-8" : size === "md" ? "w-9 h-9" : "w-10 h-10"}
      `}
      {...props}
    >
      {icon}
    </button>
  )
}
