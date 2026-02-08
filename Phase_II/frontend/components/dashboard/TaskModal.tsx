/**
 * TaskModal Component
 *
 * Modal dialog for creating new tasks.
 * Features:
 * - Clean light mode styling
 * - Backdrop overlay with blur
 * - TaskForm integration
 * - Accessible modal pattern (ARIA)
 * - Escape key to close
 * - Click outside to close
 *
 * Usage:
 * ```tsx
 * <TaskModal
 *   open={isModalOpen}
 *   onOpenChange={setIsModalOpen}
 *   onSubmit={handleCreateTask}
 * />
 * ```
 */

"use client"

import { useEffect, useRef } from "react"
import { TaskForm } from "./TaskForm"
import type { TaskCreate } from "@/lib/api/types"
import { X } from "lucide-react"

interface TaskModalProps {
  /**
   * Whether the modal is open
   */
  open: boolean

  /**
   * Callback to update open state
   */
  onOpenChange: (open: boolean) => void

  /**
   * Submit callback for task creation
   */
  onSubmit: (task: TaskCreate) => Promise<void>
}

export function TaskModal({ open, onOpenChange, onSubmit }: TaskModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [open, onOpenChange])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Handle click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onOpenChange(false)
    }
  }

  // Handle submit (close modal on success)
  const handleSubmit = async (task: TaskCreate) => {
    await onSubmit(task)
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-slate-900/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full md:max-w-2xl h-[85vh] md:h-auto md:max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-xl shadow-2xl border border-slate-200 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        {/* FR-009b: Responsive typography */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-5 md:px-6 py-4 flex items-center justify-between z-10">
          <h2 id="modal-title" className="text-lg md:text-xl font-semibold text-slate-900">
            Add New Task
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        {/* FR-008a: Generous spacing - p-5 to p-6 */}
        <div className="p-5 md:p-6">
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            mode="create"
          />
        </div>
      </div>
    </div>
  )
}
