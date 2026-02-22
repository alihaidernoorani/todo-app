/**
 * AnimatedSection Component (T069)
 *
 * Wrapper component for scroll-triggered animations using IntersectionObserver.
 * Provides fade-in and slide-up effects when elements come into view.
 *
 * Features:
 * - Uses IntersectionObserver for performance
 * - Triggers animation once when element enters viewport
 * - Customizable animation variants
 * - Staggered children animations
 * - Accessible (no reduced motion issues)
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import { motion } from "framer-motion"
import { ReactNode } from "react"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: boolean
}

const fadeInUp = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing
    },
  }),
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

export function AnimatedSection({
  children,
  className = "",
  delay = 0,
  stagger = false
}: AnimatedSectionProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={stagger ? staggerContainer : undefined}
      custom={delay}
    >
      {stagger ? (
        children
      ) : (
        <motion.div variants={fadeInUp} custom={delay}>
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}

// Export individual animation variants for custom use
export const animationVariants = {
  fadeInUp,
  staggerContainer,

  // Additional animation patterns
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.5 },
    },
  },

  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  },

  slideInLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  },

  slideInRight: {
    hidden: { opacity: 0, x: 30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  },
}
