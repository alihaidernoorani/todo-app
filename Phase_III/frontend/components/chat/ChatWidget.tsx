/**
 * Floating chat widget container
 *
 * Manages open/closed state and responsive layout
 */

'use client';

import { ChatKitWrapper } from './ChatKitWrapper';
import { useChatMessages } from '@/lib/hooks/useChatMessages';

export interface ChatWidgetProps {
  userId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Floating chat widget
 *
 * Displays a chat interface that floats on desktop and goes full-screen on mobile
 */
export function ChatWidget({ userId, isOpen, onClose }: ChatWidgetProps) {
  const { messages, isLoading, sendUserMessage } = useChatMessages(userId);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black/50 md:hidden z-40"
        onClick={onClose}
        aria-label="Close chat"
      />

      {/* Chat container */}
      <div
        className={`
          fixed z-50

          /* Mobile: Full screen */
          inset-0 md:inset-auto

          /* Desktop: Floating bottom-right */
          md:bottom-24 md:right-6
          md:w-96 md:h-[32rem]

          bg-white dark:bg-gray-900
          rounded-none md:rounded-lg
          shadow-2xl

          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            AI Assistant
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close chat"
          >
            <svg
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Chat content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-800">
          <ChatKitWrapper
            messages={messages}
            onSendMessage={sendUserMessage}
            isLoading={isLoading}
            disabled={isLoading}
          />
        </div>
      </div>
    </>
  );
}
