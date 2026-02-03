/**
 * FeaturesSection Component (T063)
 *
 * Feature highlights for the landing page.
 *
 * Features:
 * - Grid of 3 feature cards (Real-time metrics, Optimistic updates, Clean UI)
 * - Icons from Lucide React (BarChart3, Zap, Sparkles)
 * - Light glassmorphism styling using .glass class
 * - Responsive grid (1 col mobile, 3 cols desktop)
 * - Hover effects and animations
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import { motion } from "framer-motion"
import { BarChart3, Zap, Sparkles } from "lucide-react"

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: <BarChart3 className="w-8 h-8" />,
    title: "Real-time Metrics",
    description: "Track your tasks with live metrics and analytics. See your productivity at a glance with beautiful, responsive charts.",
    color: "blue",
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Optimistic Updates",
    description: "Experience instant feedback with optimistic UI updates. No waiting for server responses—changes appear immediately.",
    color: "amber",
  },
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Clean UI",
    description: "Enjoy a modern, luxury-grade interface with smooth animations and thoughtful interactions that make task management delightful.",
    color: "purple",
  },
]

const colorClasses = {
  blue: {
    icon: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200/50",
    hover: "hover:border-blue-300",
  },
  amber: {
    icon: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200/50",
    hover: "hover:border-amber-300",
  },
  purple: {
    icon: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200/50",
    hover: "hover:border-purple-300",
  },
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function FeaturesSection() {
  return (
    <section id="features-section" className="px-6 py-24 bg-slate-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold text-slate-900 font-serif mb-4"
          >
            Why TaskFlow?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Built for modern teams who value speed, elegance, and seamless collaboration.
          </motion.p>
        </div>

        {/* Features grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses]
            return (
              <motion.div
                key={index}
                variants={item}
                whileHover={{ scale: 1.02, y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={`glass rounded-2xl p-8 border ${colors.border} ${colors.hover} transition-all duration-200 group cursor-default`}
              >
                {/* Icon */}
                <div
                  className={`${colors.bg} ${colors.icon} w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-serif">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-16"
        >
          <p className="text-slate-600 mb-6">
            Ready to experience the future of task management?
          </p>
          <a
            href="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
          >
            Start Your Journey
          </a>
        </motion.div>
      </div>
    </section>
  )
}
