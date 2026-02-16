"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ProfileMenu } from './ProfileMenu'
import { Tooltip } from '@/components/atoms/Tooltip'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'

export function TopBar() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen)
  }

  const closeProfileMenu = () => {
    setIsProfileMenuOpen(false)
  }

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700"
      style={{ paddingBottom: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Top Bar Container */}
      <div className="max-w-full mx-auto px-6 md:px-10 py-4">
        <div className="flex items-center justify-between w-full">
          {/* Left Side: Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform"
            >
              <Sparkles className="w-6 h-6 text-white" />
            </motion.div>
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-50 font-heading">
              TaskFlow
            </span>
          </Link>

          {/* Right Side: User Actions */}
          <div className="flex items-center gap-4 relative ml-auto">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
              aria-label="Toggle theme"
            >
              <span className="text-slate-700 dark:text-slate-200 text-xl">
                {theme === 'light' ? '🌙' : '☀️'}
              </span>
            </button>

            {/* Profile Menu */}
            <Tooltip content="Account" position="bottom">
              <button
                onClick={toggleProfileMenu}
                className="p-1.5 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm hover:shadow-md"
                aria-label="Account"
              >
                <Avatar
                  name={user?.name || "User"}
                  email={user?.email || "user@example.com"}
                  size="medium"
                  interactive={true}
                />
              </button>
            </Tooltip>

            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <ProfileMenu
                open={isProfileMenuOpen}
                onClose={closeProfileMenu}
              />
            )}
          </div>
        </div>
      </div>
    </motion.header>
  )
}

// Add CSS animations for slide down/up
const styles = `
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100%);
      opacity: 0;
    }
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}