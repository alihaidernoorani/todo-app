/**
 * T008: Dashboard Layout with Client-Side Auth Protection
 *
 * Orchestrates navigation components based on screen size:
 * - Desktop (md+): Sidebar + Topbar
 * - Mobile (< md): MobileNav (sticky bottom)
 *
 * Features:
 * - Client-side route protection via AuthGuard
 * - Responsive breakpoints
 * - Smooth layout transitions
 * - Content area adjusts for navigation
 * - Mobile-safe bottom padding for MobileNav
 */

"use client"

import { TopBar } from '@/components/dashboard/TopBar'
import { MobileNav } from '@/components/layout/MobileNav'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { TasksProvider } from '@/contexts/TasksContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <TasksProvider>
        {/* Desktop Layout (md+) */}
        <div className="min-h-screen flex">
          {/* Main content area - No Sidebar on desktop */}
          <main className="flex-1 flex flex-col">
            {/* T065: Topbar - Desktop only */}
            <TopBar />

            {/* Page content */}
            <div className="flex-1 p-6 pb-24 md:pb-6">
              {children}
            </div>
          </main>
        </div>

        {/* T066: MobileNav - Mobile only, sticky bottom */}
        <MobileNav />
      </TasksProvider>
    </AuthGuard>
  )
}
