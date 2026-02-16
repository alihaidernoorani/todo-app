/**
 * API client for chat endpoint
 *
 * Handles communication with the backend agent endpoint
 */

import { TokenStorage } from '@/lib/auth/token-storage';

export interface SendMessageRequest {
  message: string;
}

export interface SendMessageResponse {
  conversation_id: number;
  user_message_id: number;
  agent_message_id: number;
  agent_response: string;
}

export interface SendMessageError {
  status: number;
  message: string;
}

/**
 * Send a message to the AI agent
 *
 * @param userId - User ID from authenticated session
 * @param message - User's message text
 * @returns Agent response
 * @throws SendMessageError if request fails
 */
export async function sendMessage(
  userId: string,
  message: string
): Promise<SendMessageResponse> {
  try {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const token = TokenStorage.getAccessToken();
    const response = await fetch(`${baseURL}/${userId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        message: errorData.detail || `Request failed with status ${response.status}`,
      } as SendMessageError;
    }

    const data: SendMessageResponse = await response.json();
    return data;
  } catch (error) {
    if ((error as SendMessageError).status) {
      throw error;
    }
    throw {
      status: 0,
      message: 'Network error: Unable to connect to server',
    } as SendMessageError;
  }
}
