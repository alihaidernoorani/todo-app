/**
 * T067: Dashboard Layout with Responsive Navigation
 *
 * Orchestrates navigation components based on screen size:
 * - Desktop (md+): Sidebar + Topbar
 * - Mobile (< md): MobileNav (sticky bottom)
 *
 * Features:
 * - Responsive breakpoints
 * - Smooth layout transitions
 * - Content area adjusts for navigation
 * - Mobile-safe bottom padding for MobileNav
 */

import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Desktop Layout (md+) */}
      <div className="min-h-screen flex">
        {/* T064: Sidebar - Desktop only, collapsible */}
        <Sidebar />

        {/* Main content area - Adjusts for Sidebar on desktop */}
        <main className="flex-1 flex flex-col md:ml-[280px] transition-all duration-300">
          {/* T065: Topbar - Desktop only */}
          <Topbar />

          {/* Page content - Add bottom padding on mobile for MobileNav */}
          <div className="flex-1 p-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* T066: MobileNav - Mobile only, sticky bottom */}
      <MobileNav />
    </>
  )
}
