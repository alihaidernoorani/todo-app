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

import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth/better-auth"
import { DashboardContent } from "@/components/dashboard/DashboardContent"
import { PageTransition } from "@/components/layout/PageTransition"

// Server Component - no "use client" directive
export default async function DashboardPage() {
  // Server-side session validation
  const requestHeaders = await headers()

  const session = await auth.api.getSession({
    headers: requestHeaders
  })

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect("/login")
  }

  // Extract user info for display
  const userName = session.user?.name?.split(' ')[0] || 'there'

  return (
    <PageTransition>
      {/* T077: Main landmark for accessibility and skip link target */}
      {/* FR-008a: Generous spacing - p-8 to p-10 for main layout (32-40px) */}
      {/* FR-012b: Mobile bottom padding pb-28 (112px) + safe-area-inset-bottom */}
      <main
        id="main-content"
        className="space-y-8 p-6 md:p-10 pb-28 md:pb-10"
        style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom, 0px))" }}
      >
        {/* Page header */}
        {/* FR-009b: Responsive typography - smaller on mobile, larger on desktop */}
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-2 font-serif">
            Welcome back, {userName}
          </h1>
          <p className="text-sm md:text-base text-slate-600 text-body">Task overview and management</p>
        </div>

        {/* Dashboard Content with Metrics and Tasks */}
        <DashboardContent />
      </main>
    </PageTransition>
  )
}
