/**
 * Draft Recovery Modal
 *
 * Displays when user re-authenticates after session expiry and has unsaved work.
 * Offers two actions:
 * - Restore: Pre-fill form with draft data
 * - Discard: Delete draft and start fresh
 *
 * Design:
 * - Glassmorphism modal with backdrop blur
 * - Amber accent for restore button (primary action)
 * - Ghost button for discard (secondary action)
 * - Shows draft age (e.g., "Saved 3 minutes ago")
 *
 * Usage:
 * ```tsx
 * const { getDraft, discardDraft } = useDraftRecovery()
 * const [showModal, setShowModal] = useState(false)
 *
 * useEffect(() => {
 *   const draft = getDraft()
 *   if (draft) setShowModal(true)
 * }, [])
 *
 * <DraftRecoveryModal
 *   isOpen={showModal}
 *   draft={getDraft()}
 *   onRestore={(draft) => {
 *     setTitle(draft.title)
 *     setDescription(draft.description)
 *     setPriority(draft.priority)
 *     discardDraft()
 *     setShowModal(false)
 *   }}
 *   onDiscard={() => {
 *     discardDraft()
 *     setShowModal(false)
 *   }}
 * />
 * ```
 */

"use client"

import { useEffect, useState } from "react"
import type { DraftTask } from "@/lib/api/types"

interface DraftRecoveryModalProps {
  isOpen: boolean
  draft: DraftTask | null
  onRestore: (draft: DraftTask) => void
  onDiscard: () => void
}

export function DraftRecoveryModal({
  isOpen,
  draft,
  onRestore,
  onDiscard,
}: DraftRecoveryModalProps) {
  const [draftAge, setDraftAge] = useState<string>("")

  // Calculate and update draft age
  useEffect(() => {
    if (!draft) return

    const updateAge = () => {
      const ageMs = Date.now() - draft.timestamp
      const ageMinutes = Math.floor(ageMs / 60000)
      const ageHours = Math.floor(ageMs / 3600000)

      if (ageHours > 0) {
        setDraftAge(`${ageHours} hour${ageHours > 1 ? "s" : ""} ago`)
      } else if (ageMinutes > 0) {
        setDraftAge(`${ageMinutes} minute${ageMinutes > 1 ? "s" : ""} ago`)
      } else {
        setDraftAge("just now")
      }
    }

    updateAge()
    const interval = setInterval(updateAge, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [draft])

  // Don't render if not open or no draft
  if (!isOpen || !draft) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onDiscard}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="glass-card border-ghost-amber max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-100">
                  Unsaved Work Found
                </h2>
                <p className="text-sm text-gray-400">Saved {draftAge}</p>
              </div>
            </div>
          </div>

          {/* Draft Preview */}
          <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10">
            <h3 className="text-sm font-medium text-gray-300 mb-2">
              Draft Preview:
            </h3>
            <div className="space-y-2">
              <p className="text-gray-100 font-medium">{draft.title || "(No title)"}</p>
              {draft.description && (
                <p className="text-sm text-gray-400 line-clamp-2">
                  {draft.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {draft.priority}
                </span>
              </div>
            </div>
          </div>

          {/* Info Message */}
          <p className="text-sm text-gray-400 mb-6">
            Your session expired while working on this task. Would you like to
            restore your unsaved work?
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Restore Button (Primary) */}
            <button
              onClick={() => onRestore(draft)}
              className="flex-1 px-6 py-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold transition-all duration-200 tactile-button glow-amber-subtle"
            >
              Restore Work
            </button>

            {/* Discard Button (Secondary) */}
            <button
              onClick={onDiscard}
              className="flex-1 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 font-semibold border border-white/10 transition-all duration-200 tactile-button"
            >
              Discard
            </button>
          </div>

          {/* Warning */}
          <p className="mt-4 text-xs text-gray-500 text-center">
            Drafts are automatically deleted after 24 hours
          </p>
        </div>
      </div>
    </>
  )
}
