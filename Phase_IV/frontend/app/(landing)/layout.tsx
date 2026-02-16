/**
 * Landing Layout (T064 - Optional)
 *
 * Minimal layout for public landing pages.
 *
 * Features:
 * - Minimal header with TaskFlow logo
 * - Simple footer
 * - No sidebar or auth protection
 * - Clean, unobtrusive design
 *
 * Note: This layout is optional. The landing page (/) currently
 * uses the root layout directly. This can be used for future
 * marketing pages that need a consistent header/footer.
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Minimal Header */}
      <header className="sticky top-0 z-50 backdrop-blur-sm bg-white/80 border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 font-heading">
              TaskFlow
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/signup"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} TaskFlow. All rights reserved.
        </div>
      </footer>
    </div>
  )
}
