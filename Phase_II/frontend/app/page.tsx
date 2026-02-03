/**
 * Public Landing Page (T061, T068, T069)
 *
 * Main entry point for unauthenticated users.
 *
 * Features:
 * - Hero section with TaskFlow branding
 * - Feature highlights (Real-time metrics, Optimistic updates, Clean UI)
 * - CTA buttons: "Sign Up" (→ /signup) and "Log In" (→ /login)
 * - Smooth scroll-to-features interaction (T068)
 * - Scroll-to-top button (T068)
 * - Framer Motion scroll-triggered animations (T069)
 * - Light theme with Clean Light Mode palette
 * - Responsive design
 *
 * Auth Scoping:
 * - This page is PUBLIC (no auth required)
 * - AuthGuard only applies to /dashboard routes
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import { motion } from "framer-motion"
import { LandingHeader } from "@/components/landing/LandingHeader"
import { LandingHero } from "@/components/landing/LandingHero"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { ScrollToTop } from "@/components/landing/ScrollToTop"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header Navigation */}
      <LandingHeader />

      {/* Hero Section */}
      <LandingHero />

      {/* Features Section */}
      <FeaturesSection />

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Footer with fade-in animation */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-slate-200 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {/* Branding */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 font-serif mb-2">
                TaskFlow
              </h3>
              <p className="text-slate-600 text-sm">
                Modern task management for modern teams.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a href="/login" className="hover:text-blue-600 transition-colors">
                    Log In
                  </a>
                </li>
                <li>
                  <a href="/signup" className="hover:text-blue-600 transition-colors">
                    Sign Up
                  </a>
                </li>
                <li>
                  <a href="/dashboard" className="hover:text-blue-600 transition-colors">
                    Dashboard
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4">
                Legal
              </h4>
              <ul className="space-y-2 text-slate-600">
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-blue-600 transition-colors">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Copyright with fade-in */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="border-t border-slate-200 mt-8 pt-8 text-center text-sm text-slate-500"
          >
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
