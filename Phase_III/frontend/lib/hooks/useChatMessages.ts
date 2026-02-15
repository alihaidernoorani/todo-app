/**
 * Custom hook for managing chat messages state
 *
 * Handles message array, loading states, error states, and sending messages
 */

import { useState, useCallback } from 'react';
import { sendMessage, SendMessageError } from '../api/chat';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface UseChatMessagesReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendUserMessage: (message: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing chat messages
 *
 * @param userId - User ID from authenticated session
 * @returns Chat messages state and handlers
 */
export function useChatMessages(userId: string | null): UseChatMessagesReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendUserMessage = useCallback(
    async (message: string) => {
      if (!userId) {
        setError('User not authenticated');
        return;
      }

      if (!message.trim()) {
        setError('Message cannot be empty');
        return;
      }

      // Clear any previous errors
      setError(null);

      // Add user message immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        // Call backend API
        const response = await sendMessage(userId, message);

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: `assistant-${response.agent_message_id}`,
          role: 'assistant',
          content: response.agent_response,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (err) {
        const apiError = err as SendMessageError;
        let errorMessage = 'Failed to send message';

        if (apiError.status === 401 || apiError.status === 403) {
          errorMessage = 'Session expired. Please log in again.';
        } else if (apiError.status === 500) {
          errorMessage = 'Agent is currently unavailable. Please try again later.';
        } else if (apiError.status === 0) {
          errorMessage = apiError.message;
        } else {
          errorMessage = apiError.message || errorMessage;
        }

        setError(errorMessage);

        // Add error message as assistant message
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `❌ ${errorMessage}`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendUserMessage,
    clearError,
  };
}
