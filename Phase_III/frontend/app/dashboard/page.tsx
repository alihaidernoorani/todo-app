/**
 * Dashboard Page
 *
 * Main TaskFlow dashboard for task management.
 * Features:
 * - Server-side session validation (redirects to sign in if not authenticated)
 * - Real-time task metrics grid
 * - Task stream with CRUD operations
 * - Suspense boundaries for streaming data
 * - Optimistic UI updates
 *
 * Layout:
 * - Page header with title and description
 * - Metrics grid (4 cards: Total, Completed, Pending, High Priority)
 * - Task stream with create/edit/delete functionality
 *
 * Data Loading:
 * - Session: Server-side check via Better Auth
 * - Metrics: Server Action → Backend API → Suspense streaming
 * - Tasks: Server Action → Backend API → Optimistic updates
 */

"use client"

import { useState } from 'react'
import { OverviewSection } from '@/components/dashboard/OverviewSection'
import { AddTaskPanel } from '@/components/dashboard/AddTaskPanel'
import { PageTransition } from '@/components/layout/PageTransition'
import { useAuth } from '@/contexts/AuthContext'
import { ChatWidget } from '@/components/chat/ChatWidget'
import { ChatToggleButton } from '@/components/chat/ChatToggleButton'

export default function DashboardPage() {
  const { user } = useAuth()
  const userName = user?.name || 'there'
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Convert string ID to number for backend API
  const userId = user?.id ? parseInt(user.id, 10) : null

  return (
    <PageTransition>
      {/* T077: Main landmark for accessibility and skip link target */}
      {/* FR-008a: Generous spacing - p-8 to p-10 for main layout (32-40px) */}
      {/* FR-012b: Mobile bottom padding pb-28 (112px) + safe-area-inset-bottom */}
      <main
        id="main-content"
        className="space-y-8 px-6 md:px-10 py-6 md:py-10 pb-28 md:pb-10 bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Page header */}
        {/* FR-009b: Responsive typography - smaller on mobile, larger on desktop */}
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-slate-50 mb-3 font-heading">
            Welcome back, {userName}
          </h1>
          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 text-body">Task overview and management</p>
        </div>

        {/* Dashboard Content with Metrics and Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Overview */}
          <div className="lg:col-span-3/5 space-y-6">
            <OverviewSection />
          </div>

          {/* Right Column: Add Task */}
          <div className="lg:col-span-2/5 space-y-6">
            <section aria-labelledby="add-task-heading">
              <h2 id="add-task-heading" className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-200 mb-5">
                Create Task
              </h2>
              <AddTaskPanel />
            </section>
          </div>
        </div>
      </main>

      {/* Chat Widget and Toggle Button */}
      <ChatWidget
        userId={userId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
      <ChatToggleButton
        isOpen={isChatOpen}
        onClick={() => setIsChatOpen(!isChatOpen)}
      />
    </PageTransition>
  )
}
