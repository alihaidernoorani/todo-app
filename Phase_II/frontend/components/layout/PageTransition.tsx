/**
 * T060: Cinematic Page Transitions
 *
 * Wraps page content with Framer Motion animations for smooth route changes.
 * Features fade-in and slide-up animations for elegant transitions.
 */

'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99], // Custom easing for cinematic feel
      }}
    >
      {children}
    </motion.div>
  )
}
