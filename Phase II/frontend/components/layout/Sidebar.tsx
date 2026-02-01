/**
 * T064: Sidebar Component
 *
 * Collapsible navigation sidebar for desktop (md+).
 * Features:
 * - Glassmorphism styling with Midnight Stone palette
 * - Collapsible state management
 * - Smooth slide-in/out transitions (Framer Motion)
 * - Navigation links with active states
 * - Logo and branding
 *
 * Desktop only - hidden on mobile (< md breakpoint)
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, ListTodo, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home className="w-5 h-5" /> },
  { label: 'Tasks', href: '/dashboard', icon: <ListTodo className="w-5 h-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-5 h-5" /> },
]

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      initial={{ x: 0 }}
      animate={{ x: isCollapsed ? -280 : 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="hidden md:flex flex-col h-screen w-[280px] glass-dark border-r border-ghost-amber fixed left-0 top-0 z-40"
    >
      {/* Logo and Brand */}
      <div className="p-6 border-b border-ghost-amber">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-heading text-2xl font-bold text-gray-100">
                Command Center
              </h1>
              <p className="text-sm text-gray-400 mt-1">Mission Control</p>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              <span className="text-2xl font-bold text-amber-500">CC</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                transition-all duration-200
                ${
                  isActive
                    ? 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
                    : 'text-gray-300 hover:bg-white/5 hover:border hover:border-white/10'
                }
              `}
            >
              <span
                className={`
                ${isActive ? 'text-amber-400' : 'text-gray-400'}
              `}
              >
                {item.icon}
              </span>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          )
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <div className="p-4 border-t border-ghost-amber">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/20
            text-gray-300 hover:text-amber-300
            transition-all duration-200
          "
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="font-medium">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
