/**
 * T013: Sidebar Component - TaskFlow (Clean Light Mode)
 *
 * Collapsible navigation sidebar for desktop (md+).
 * Features:
 * - Clean Light Mode styling (slate-50 background, blue accents)
 * - TaskFlow branding (replaces "Command Center")
 * - Collapsible state management
 * - Smooth slide-in/out transitions (Framer Motion)
 * - Navigation links with active states
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
      className="hidden md:flex flex-col h-screen w-[280px] bg-slate-50/95 backdrop-blur-sm border-r border-slate-200 fixed left-0 top-0 z-40"
    >
      {/* Logo and Brand */}
      <div className="p-6 border-b border-slate-200">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-heading text-2xl font-bold text-slate-900">
                TaskFlow
              </h1>
              <p className="text-sm text-slate-600 mt-1">My Tasks</p>
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
              <span className="text-2xl font-bold text-blue-600">TF</span>
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
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }
              `}
            >
              <span
                className={`
                ${isActive ? 'text-blue-600' : 'text-slate-500'}
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
      <div className="p-4 border-t border-slate-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            bg-white hover:bg-slate-100 border border-slate-300
            text-slate-600 hover:text-blue-600
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
