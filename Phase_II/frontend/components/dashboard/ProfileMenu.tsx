"use client"

import { motion } from 'framer-motion'
import { User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/better-auth-client'
import { useAuth } from '@/contexts/AuthContext'

export function ProfileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const { user } = useAuth()

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      // Clear any local storage
      localStorage.clear()
      router.push("/login")
    } catch (error) {
      console.error("Failed to sign out:", error)
    } finally {
      onClose()
    }
  }

  if (!open) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="absolute top-12 right-0 w-56 rounded-lg bg-white shadow-lg border border-slate-200/80 backdrop-blur-sm z-50"
    >
      {/* Profile Section */}
      <div className="p-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <ul className="p-2">
        {/* Profile */}
        <li>
          <button
            onClick={() => {
              onClose()
              router.push("/dashboard")
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors duration-200"
          >
            <User className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium">Profile</span>
          </button>
        </li>

        {/* Settings - Hidden until implemented */}
        {/* Uncomment when settings are ready */}
        {/* <li>
          <button
            onClick={() => {
              onClose()
              router.push("/settings")
            }}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-slate-700 hover:bg-slate-50 transition-colors duration-200"
          >
            <Settings className="w-5 h-5 text-slate-500" />
            <span className="text-sm font-medium">Settings</span>
          </button>
        </li> */}

        {/* Divider */}
        <li className="my-1">
          <div className="h-0.5 bg-slate-200" />
        </li>

        {/* Sign Out */}
        <li>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </li>
      </ul>
    </motion.div>
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