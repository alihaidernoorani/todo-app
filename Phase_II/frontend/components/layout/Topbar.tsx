/**
 * T014: Topbar Component - TaskFlow (Clean Light Mode)
 *
 * Top navigation bar for desktop layout.
 * Features:
 * - "My Tasks" page title (replaces "Dashboard")
 * - User menu with sign-out option
 * - Notifications placeholder
 * - Clean light theme styling
 * - Responsive positioning (adjusts for Sidebar)
 *
 * Desktop only - hidden on mobile (< md breakpoint)
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, User, LogOut, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/better-auth-client'

export function Topbar() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign-out failed:', error)
    }
  }

  return (
    <header className="hidden md:block sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left side - Page title or breadcrumb */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">My Tasks</h2>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            className="
              relative p-2 rounded-lg
              text-slate-600 hover:text-slate-900
              bg-slate-50 hover:bg-slate-100
              border border-slate-200
              transition-all duration-200
            "
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="
                flex items-center gap-2 px-3 py-2 rounded-lg
                text-slate-700 hover:text-slate-900
                bg-slate-50 hover:bg-slate-100
                border border-slate-200
                transition-all duration-200
              "
              aria-label="User menu"
            >
              <User className="w-5 h-5" />
              <span className="font-medium">Account</span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isUserMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                  className="
                    absolute right-0 mt-2 w-48
                    bg-white rounded-lg border border-slate-200
                    shadow-lg
                  "
                >
                  <div className="py-2">
                    {/* Settings */}
                    <button
                      className="
                        w-full flex items-center gap-3 px-4 py-2
                        text-left text-slate-700 hover:text-slate-900
                        hover:bg-slate-50
                        transition-colors duration-150
                      "
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>

                    {/* Divider */}
                    <div className="my-2 border-t border-slate-200" />

                    {/* Sign Out */}
                    <button
                      onClick={handleSignOut}
                      className="
                        w-full flex items-center gap-3 px-4 py-2
                        text-left text-red-600 hover:text-red-700
                        hover:bg-red-50
                        transition-colors duration-150
                      "
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}
