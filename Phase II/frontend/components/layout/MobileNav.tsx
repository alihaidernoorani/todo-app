/**
 * T066: MobileNav Component
 *
 * Sticky bottom navigation for mobile devices.
 * Features:
 * - Fixed bottom positioning (within thumb reach)
 * - Glassmorphism styling (bg-stone-900/95, backdrop-blur-lg)
 * - Amber active state indicators
 * - Icon-only navigation for space efficiency
 * - Touch-optimized tap targets (min 44px)
 *
 * Mobile only - hidden on desktop (md+)
 */

'use client'

import { Home, ListTodo, Settings } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <Home className="w-6 h-6" /> },
  { label: 'Tasks', href: '/dashboard', icon: <ListTodo className="w-6 h-6" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="w-6 h-6" /> },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-50
        glass-dark border-t border-ghost-amber
        safe-area-inset-bottom
      "
      style={{
        backgroundColor: 'rgba(28, 25, 23, 0.95)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[64px] min-h-[44px] gap-1
                rounded-lg transition-all duration-200
                ${
                  isActive
                    ? 'text-amber-400'
                    : 'text-gray-400 hover:text-gray-300'
                }
              `}
              aria-label={item.label}
            >
              <span
                className={`
                  transition-all duration-200
                  ${isActive ? 'scale-110' : 'scale-100'}
                `}
              >
                {item.icon}
              </span>
              <span
                className={`
                  text-xs font-medium
                  ${isActive ? 'text-amber-400' : 'text-gray-500'}
                `}
              >
                {item.label}
              </span>
              {/* Active indicator */}
              {isActive && (
                <span
                  className="
                    absolute bottom-0 left-1/2 -translate-x-1/2
                    w-1 h-1 rounded-full
                    bg-amber-400 shadow-neon-amber
                  "
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
