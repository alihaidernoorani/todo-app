/**
 * Draft Recovery Hook
 *
 * Saves form state to localStorage when session expires (401 error).
 * Restores draft data after user re-authenticates.
 *
 * Features:
 * - Listens for 401 errors via custom 'session-expired' event
 * - Saves current form state to localStorage
 * - Deletes drafts older than 24 hours on mount
 * - Provides methods to restore and discard drafts
 *
 * Usage:
 * ```tsx
 * const { saveDraft, getDraft, discardDraft, hasDraft } = useDraftRecovery()
 *
 * // Save draft when session expires
 * useEffect(() => {
 *   window.addEventListener('session-expired', () => {
 *     saveDraft({ title, description, priority })
 *   })
 * }, [title, description, priority])
 *
 * // Check for draft on mount
 * useEffect(() => {
 *   if (hasDraft()) {
 *     // Show modal to restore
 *   }
 * }, [])
 * ```
 */

"use client"

import { useEffect } from "react"
import { authClient } from "../auth/better-auth-client"
import type { DraftTask } from "../api/types"

const DRAFT_PREFIX = "draft-task-"
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Custom hook for draft recovery on session expiry
 */
export function useDraftRecovery() {
  // Get user ID from Better Auth session
  const { data: session } = authClient.useSession()
  const userId = session?.user?.id || null

  // Clean up old drafts on mount
  useEffect(() => {
    cleanupOldDrafts()
  }, [])

  /**
   * Get localStorage key for the current user's draft
   */
  const getDraftKey = (): string | null => {
    if (!userId) return null
    return `${DRAFT_PREFIX}${userId}`
  }

  /**
   * Save current form state to localStorage
   * Called when 401 error is detected
   */
  const saveDraft = (draftData: Omit<DraftTask, "timestamp">) => {
    const key = getDraftKey()
    if (!key) {
      console.warn("Cannot save draft: user ID not available")
      return
    }

    const draft: DraftTask = {
      ...draftData,
      timestamp: Date.now(),
    }

    try {
      localStorage.setItem(key, JSON.stringify(draft))
      console.log("Draft saved successfully")
    } catch (error) {
      console.error("Failed to save draft:", error)
    }
  }

  /**
   * Get saved draft from localStorage
   * Returns null if no draft exists or draft is expired
   */
  const getDraft = (): DraftTask | null => {
    const key = getDraftKey()
    if (!key) return null

    try {
      const draftJson = localStorage.getItem(key)
      if (!draftJson) return null

      const draft: DraftTask = JSON.parse(draftJson)

      // Check if draft is expired (older than 24 hours)
      const age = Date.now() - draft.timestamp
      if (age > DRAFT_MAX_AGE_MS) {
        // Draft expired - delete it
        localStorage.removeItem(key)
        return null
      }

      return draft
    } catch (error) {
      console.error("Failed to get draft:", error)
      return null
    }
  }

  /**
   * Delete saved draft from localStorage
   * Called when user discards or restores draft
   */
  const discardDraft = () => {
    const key = getDraftKey()
    if (!key) return

    try {
      localStorage.removeItem(key)
      console.log("Draft discarded")
    } catch (error) {
      console.error("Failed to discard draft:", error)
    }
  }

  /**
   * Check if a draft exists for the current user
   */
  const hasDraft = (): boolean => {
    return getDraft() !== null
  }

  /**
   * Clean up drafts older than 24 hours for all users
   * Runs on mount to prevent localStorage bloat
   */
  const cleanupOldDrafts = () => {
    try {
      const keysToRemove: string[] = []

      // Scan localStorage for draft keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key || !key.startsWith(DRAFT_PREFIX)) continue

        const draftJson = localStorage.getItem(key)
        if (!draftJson) continue

        try {
          const draft: DraftTask = JSON.parse(draftJson)
          const age = Date.now() - draft.timestamp

          if (age > DRAFT_MAX_AGE_MS) {
            keysToRemove.push(key)
          }
        } catch {
          // Invalid JSON - mark for removal
          keysToRemove.push(key)
        }
      }

      // Remove expired drafts
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} expired drafts`)
      }
    } catch (error) {
      console.error("Failed to cleanup old drafts:", error)
    }
  }

  return {
    saveDraft,
    getDraft,
    discardDraft,
    hasDraft,
  }
}

/**
 * Hook to listen for session expiry events and auto-save drafts
 *
 * Usage:
 * ```tsx
 * useSessionExpiryListener({
 *   onSessionExpiry: () => {
 *     saveDraft({ title, description, priority })
 *   }
 * })
 * ```
 */
export function useSessionExpiryListener(options: {
  onSessionExpiry: () => void
}) {
  useEffect(() => {
    const handleSessionExpiry = () => {
      console.log("Session expired - triggering draft save")
      options.onSessionExpiry()
    }

    // Listen for custom session-expired event from ApiClient
    window.addEventListener("session-expired", handleSessionExpiry)

    return () => {
      window.removeEventListener("session-expired", handleSessionExpiry)
    }
  }, [options.onSessionExpiry])
}
