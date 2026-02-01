"use client";

import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface UpdateIndicatorProps {
  /**
   * Whether a concurrent update has been detected
   */
  hasUpdate: boolean;

  /**
   * Callback when user clicks to refresh and load the latest version
   */
  onRefresh?: () => void;

  /**
   * Custom message to display (default: "Updated elsewhere")
   */
  message?: string;

  /**
   * Position of the indicator (default: "top-right")
   */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "inline";

  /**
   * Custom className for additional styling
   */
  className?: string;
}

/**
 * UpdateIndicator Component
 *
 * Displays an amber badge when concurrent updates are detected via ETag mismatch.
 * Includes a refresh button to reload the latest version.
 *
 * Usage:
 * ```tsx
 * const { hasUpdate, latestEtag } = useConcurrentUpdate(resourceUrl, currentEtag);
 *
 * <UpdateIndicator
 *   hasUpdate={hasUpdate}
 *   onRefresh={() => refetchTask(latestEtag)}
 * />
 * ```
 */
export function UpdateIndicator({
  hasUpdate,
  onRefresh,
  message = "Updated elsewhere",
  position = "top-right",
  className = "",
}: UpdateIndicatorProps) {
  // Position classes for different placements
  const positionClasses = {
    "top-left": "fixed top-4 left-4 z-50",
    "top-right": "fixed top-4 right-4 z-50",
    "bottom-left": "fixed bottom-4 left-4 z-50",
    "bottom-right": "fixed bottom-4 right-4 z-50",
    inline: "relative",
  };

  return (
    <AnimatePresence>
      {hasUpdate && (
        <motion.div
          initial={{ opacity: 0, y: position.startsWith("top") ? -20 : 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: position.startsWith("top") ? -20 : 20, scale: 0.9 }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
          }}
          className={`${positionClasses[position]} ${className}`}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/20 backdrop-blur-lg border border-amber-500/30 shadow-2xl">
            {/* Amber pulse indicator */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className="absolute w-3 h-3 bg-amber-500 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 0.3, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="w-2 h-2 bg-amber-500 rounded-full" />
            </div>

            {/* Message text */}
            <span className="text-sm font-medium text-amber-100 font-sans">
              {message}
            </span>

            {/* Refresh button */}
            {onRefresh && (
              <motion.button
                onClick={onRefresh}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/30 hover:bg-amber-500/40 border border-amber-500/40 transition-colors"
                aria-label="Refresh to load latest version"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-100" />
                <span className="text-xs font-medium text-amber-100 font-sans">
                  Refresh
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Inline variant for use within task items or cards
 */
export function InlineUpdateIndicator({
  hasUpdate,
  onRefresh,
  message = "Updated by another user",
}: Omit<UpdateIndicatorProps, "position" | "className">) {
  return (
    <UpdateIndicator
      hasUpdate={hasUpdate}
      onRefresh={onRefresh}
      message={message}
      position="inline"
      className="mb-2"
    />
  );
}
