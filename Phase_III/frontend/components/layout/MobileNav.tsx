/**
 * T015: MobileNav Component - Clean Light Mode
 *
 * Sticky bottom navigation for mobile devices.
 * Features:
 * - Fixed bottom positioning (within thumb reach)
 * - Clean light theme styling (bg-white, border-slate-200)
 * - Blue active state indicators (replaces amber)
 * - Icon-only navigation for space efficiency
 * - Touch-optimized tap targets (min 48px)
 * - Account menu that opens bottom sheet
 *
 * Mobile only - hidden on desktop (md+)
 */

'use client'

import { useState } from 'react'
import { Home, ListTodo, UserCircle } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AccountSheet } from './AccountSheet'

interface NavItem {
  label: string
  href?: string
  icon: React.ReactNode
  action?: () => void
}

export function MobileNav() {
  const pathname = usePathname()
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false)

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="w-6 h-6" /> },
    { label: 'Tasks', href: '/dashboard', icon: <ListTodo className="w-6 h-6" /> },
    {
      label: 'Account',
      icon: <UserCircle className="w-6 h-6" />,
      action: () => setIsAccountSheetOpen(true)
    },
  ]

  return (
    <>
      <nav
        className="
          md:hidden fixed bottom-0 left-0 right-0 z-50
          bg-white border-t border-slate-200
        "
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.map((item, index) => {
            const isActive = item.href ? pathname === item.href : false

            // For items with actions (like Account menu)
            if (item.action) {
              return (
                <button
                  key={`${item.label}-${index}`}
                  onClick={item.action}
                  className={`
                    flex flex-col items-center justify-center
                    min-w-[64px] min-h-[48px] gap-1
                    rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? 'text-blue-600'
                        : 'text-slate-500 hover:text-slate-700'
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
                      ${isActive ? 'text-blue-600' : 'text-slate-500'}
                    `}
                  >
                    {item.label}
                  </span>
                </button>
              )
            }

            // For regular links
            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href!}
                className={`
                  flex flex-col items-center justify-center
                  min-w-[64px] min-h-[48px] gap-1
                  rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
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
                    ${isActive ? 'text-blue-600' : 'text-slate-500'}
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
                      bg-blue-600
                    "
                  />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Account Bottom Sheet */}
      <AccountSheet
        open={isAccountSheetOpen}
        onOpenChange={setIsAccountSheetOpen}
      />
    </>
  )
}
