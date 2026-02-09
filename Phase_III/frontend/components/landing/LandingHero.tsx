/**
 * LandingHero Component (T062)
 *
 * Hero section for the public landing page with TaskFlow branding.
 *
 * Features:
 * - Large heading with Playfair Display font
 * - Subtitle with Inter font
 * - CTA buttons with blue accent
 * - Responsive design
 * - Smooth animations on load
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"

export function LandingHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-blue-50/30 to-slate-50 -z-10" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto text-center space-y-8">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 text-blue-700 text-sm font-medium border border-blue-200/50"
        >
          <Sparkles className="w-4 h-4" />
          <span>Built with modern web technologies</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-slate-900 font-heading leading-tight"
        >
          Welcome to{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
        >
          Modern task management with real-time metrics, optimistic updates,
          and a clean, beautiful interface designed for productivity.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        >
          <Link href="/signup">
            <button className="group px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30 flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>

          <button
            onClick={() => {
              const featuresSection = document.getElementById('features-section')
              featuresSection?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="px-8 py-4 bg-white text-slate-700 rounded-lg font-semibold text-lg border-2 border-slate-200 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Learn More
          </button>

          <Link href="/login">
            <button className="px-8 py-4 bg-white text-slate-700 rounded-lg font-semibold text-lg border-2 border-slate-200 hover:border-blue-300 hover:text-blue-700 transition-all duration-200 shadow-sm hover:shadow-md">
              Log In
            </button>
          </Link>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="pt-8 flex flex-wrap justify-center gap-8 text-sm text-slate-500"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Real-time sync</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Instant updates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
            <span>Modern design</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
