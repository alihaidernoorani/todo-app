/**
 * T008: Dashboard Layout with Client-Side Auth Protection
 *
 * Features:
 * - Client-side route protection via AuthGuard
 * - TopBar navigation for all screen sizes
 * - Responsive breakpoints
 * - Smooth layout transitions
 */

"use client"

import { TopBar } from '@/components/dashboard/TopBar'
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
        {/* Layout for all screen sizes */}
        <div className="min-h-screen flex">
          {/* Main content area */}
          <main className="flex-1 flex flex-col">
            {/* TopBar - All screen sizes */}
            <TopBar />

            {/* Page content */}
            <div className="flex-1 p-6">
              {children}
            </div>
          </main>
        </div>
      </TasksProvider>
    </AuthGuard>
  )
}
