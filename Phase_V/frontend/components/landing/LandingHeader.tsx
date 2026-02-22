/**
 * LandingHeader Component (T070)
 *
 * Header navigation for public landing page.
 *
 * Features:
 * - TaskFlow logo and branding
 * - Login and Sign Up CTAs
 * - Sticky positioning with backdrop blur
 * - Clean Light Mode styling
 * - Responsive design
 *
 * Only displayed on landing page (not dashboard)
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function LandingHeader() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200"
    >
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
    </motion.header>
  )
}
