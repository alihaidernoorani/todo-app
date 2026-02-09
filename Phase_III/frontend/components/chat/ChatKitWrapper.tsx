/**
 * ChatKit wrapper component
 *
 * Integrates OpenAI ChatKit SDK with our message state management
 */

'use client';

import { Chat } from '@openai/chatkit';
import { ChatMessage } from '@/lib/hooks/useChatMessages';

export interface ChatKitWrapperProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

/**
 * ChatKit wrapper component
 *
 * Wraps the ChatKit Chat component and connects it to our state management
 */
export function ChatKitWrapper({
  messages,
  onSendMessage,
  isLoading,
  disabled = false,
}: ChatKitWrapperProps) {
  // Transform our messages to ChatKit format
  const chatKitMessages = messages.map((msg) => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    createdAt: msg.timestamp.toISOString(),
  }));

  const handleSend = (message: string) => {
    // Validate empty message
    if (!message.trim()) {
      return;
    }
    onSendMessage(message);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <Chat
        messages={chatKitMessages}
        onSend={handleSend}
        isLoading={isLoading}
        disabled={disabled || isLoading}
        placeholder={
          disabled
            ? "Please wait..."
            : "Type a message to your AI assistant..."
        }
        className="h-full"
      />
    </div>
  );
}
