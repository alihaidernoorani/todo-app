/**
 * Account Sheet Component
 *
 * Mobile bottom sheet for account actions.
 * Features:
 * - Profile option
 * - Settings (hidden until implemented)
 * - Sign Out button
 * - Slides up from bottom
 * - Backdrop overlay
 * - Touch-friendly targets (min 48px height)
 *
 * Usage:
 * ```tsx
 * <AccountSheet open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */

"use client"

import { useEffect } from "react"
import { User, Settings, LogOut } from "lucide-react"
import { signOut } from "@/lib/auth/better-auth-client"
import { useRouter } from "next/navigation"

interface AccountSheetProps {
  /**
   * Whether the sheet is open
   */
  open: boolean

  /**
   * Callback to update open state
   */
  onOpenChange: (open: boolean) => void
}

export function AccountSheet({ open, onOpenChange }: AccountSheetProps) {
  const router = useRouter()

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Failed to sign out:", error)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 md:hidden"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="account-sheet-title"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="
          absolute bottom-0 left-0 right-0
          bg-white rounded-t-2xl
          shadow-2xl
          animate-slide-up
          pb-safe
        "
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: "slideUp 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)"
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-slate-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pt-2 pb-4 border-b border-slate-200">
          <h2 id="account-sheet-title" className="text-lg font-semibold text-slate-900">
            Account
          </h2>
        </div>

        {/* Menu Items */}
        <div className="px-4 py-2">
          {/* Profile Option */}
          <button
            onClick={() => {
              onOpenChange(false)
              router.push("/dashboard")
            }}
            className="
              w-full flex items-center gap-4
              px-4 py-4 rounded-lg
              text-slate-700 hover:bg-slate-50
              transition-colors duration-200
              min-h-[48px]
            "
          >
            <User className="w-5 h-5 text-slate-500" />
            <span className="text-base font-medium">Profile</span>
          </button>

          {/* Settings Option - Hidden until implemented */}
          {/* Uncomment when settings are ready */}
          {/* <button
            onClick={() => {
              onOpenChange(false)
              router.push("/settings")
            }}
            className="
              w-full flex items-center gap-4
              px-4 py-4 rounded-lg
              text-slate-700 hover:bg-slate-50
              transition-colors duration-200
              min-h-[48px]
            "
          >
            <Settings className="w-5 h-5 text-slate-500" />
            <span className="text-base font-medium">Settings</span>
          </button> */}

          {/* Divider */}
          <div className="my-2 border-t border-slate-200" />

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="
              w-full flex items-center gap-4
              px-4 py-4 rounded-lg
              text-red-600 hover:bg-red-50
              transition-colors duration-200
              min-h-[48px]
            "
          >
            <LogOut className="w-5 h-5" />
            <span className="text-base font-medium">Sign Out</span>
          </button>
        </div>

        {/* Bottom spacing for safe area */}
        <div className="h-4" />
      </div>
    </div>
  )
}

// Add keyframes animation for slide up
const styles = `
  @keyframes slideUp {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }
`

// Inject styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style")
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}
