/**
 * ScrollToTop Component (T068)
 *
 * Floating button that appears after user scrolls down.
 * Smoothly scrolls back to top when clicked.
 *
 * Features:
 * - Appears after scrolling 300px down
 * - Smooth fade-in/out with Framer Motion
 * - Smooth scroll behavior
 * - Blue accent styling
 * - Fixed bottom-right position
 * - Accessible with aria-label
 *
 * Design: Clean Light Mode with Slate & Snow palette
 */

"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUp } from "lucide-react"

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      // Show button when page is scrolled down 300px
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    // Add scroll event listener
    window.addEventListener("scroll", toggleVisibility)

    // Clean up
    return () => window.removeEventListener("scroll", toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={scrollToTop}
          className="
            fixed bottom-8 right-8 z-50
            p-3 rounded-full
            bg-blue-600 text-white
            hover:bg-blue-700
            shadow-lg shadow-blue-600/25
            hover:shadow-xl hover:shadow-blue-600/30
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          aria-label="Scroll to top"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp className="w-6 h-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
