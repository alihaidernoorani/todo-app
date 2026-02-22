"use client"

import { motion } from 'framer-motion'
import { UserCircle } from 'lucide-react'

interface AvatarProps {
  /**
   * User name or initials to display
   */
  name?: string

  /**
   * User email or unique identifier
   */
  email?: string

  /**
   * Avatar size (small, medium, large)
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * Click handler for avatar
   */
  onClick?: () => void

  /**
   * Whether avatar is interactive
   */
  interactive?: boolean
}

export function Avatar({
  name = 'User',
  email,
  size = 'medium',
  onClick,
  interactive = true,
}: AvatarProps) {
  // Extract initials from name
  const initials = name
    ?.split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    ?.substring(0, 2) || 'U'

  // Generate background color based on email (or name if email not available)
  const hash = (email || name).split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Darker color for better visibility (increased saturation and reduced lightness)
  const backgroundColor = `hsl(${(hash % 36) * 10}, 70%, 45%)`

  // Determine size classes
  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-12 h-12 text-base',
  }

  const interactiveClasses = interactive
    ? 'cursor-pointer transition-colors duration-200 hover:shadow-md'
    : 'cursor-default'

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      whileHover={{ scale: interactive ? 1.05 : 1 }}
      whileTap={{ scale: interactive ? 0.95 : 1 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={interactive ? onClick : undefined}
      style={{ backgroundColor }}
      className={`${sizeClasses[size]} ${interactiveClasses} rounded-full text-white flex items-center justify-center font-semibold shadow-sm`}
    >
      {name && initials.length > 0 ? (
        initials
      ) : (
        <UserCircle className="w-5 h-5" />
      )}
    </motion.div>
  )
}

// Add CSS for avatar hover states
const styles = `
  .avatar-hover {
    transition: all 0.2s ease;
  }

  .avatar-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}