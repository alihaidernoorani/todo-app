/**
 * API Client JWT Tests
 *
 * Test suite for JWT header injection functionality in the API client including:
 * - JWT header injection when token exists
 * - JWT header omission when token doesn't exist
 * - JWT header omission when token is expired
 * - Error handling for expired tokens
 */

import { ApiClient } from '../lib/api/client';
import { TokenStorage } from '../lib/auth/token-storage';

// Mock localStorage
const mockLocalStorage = (() => {
  let store: { [key: string]: string } = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    getStore: () => store,
  };
})();

// Mock global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock fetch
const mockFetch = jest.fn();

global.fetch = mockFetch;

// Mock window.dispatchEvent
const mockDispatchEvent = jest.fn();
Object.defineProperty(window, 'dispatchEvent', {
  value: mockDispatchEvent,
});

describe('ApiClient JWT Integration', () => {
  let apiClient: ApiClient;
  const userId = 'test-user-123';

  beforeEach(() => {
    localStorage.clear();
    mockFetch.mockClear();
    mockDispatchEvent.mockClear();

    // Mock NEXT_PUBLIC_API_URL
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
    apiClient = new ApiClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('JWT Header Injection', () => {
    it('should inject Authorization header when valid JWT token exists', async () => {
      // Create a valid token that expires in 1 hour
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const validToken = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(validToken);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.get(userId, '/test-endpoint');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${validToken}`,
          }),
        })
      );
    });

    it('should not inject Authorization header when no token exists', async () => {
      // Ensure no token is set
      TokenStorage.clearAccessToken();

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.get(userId, '/test-endpoint');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');
    });

    it('should not inject Authorization header when token is expired', async () => {
      // Create an expired token
      const expiredPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(expiredPayload));
      const signature = btoa('fake-signature');
      const expiredToken = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(expiredToken);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.get(userId, '/test-endpoint');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');
    });

    it('should not inject Authorization header when token is empty', async () => {
      TokenStorage.setAccessToken('');

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.get(userId, '/test-endpoint');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).not.toHaveProperty('Authorization');
    });
  });

  describe('Expired Token Handling', () => {
    it('should clear token and dispatch session-expired event on 401 response', async () => {
      // Create a valid token initially
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Token expired' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.get(userId, '/test-endpoint')).rejects.toThrow(
        'Your authentication token has expired. Please sign in again.'
      );

      // Verify token was cleared
      expect(TokenStorage.getAccessToken()).toBeNull();

      // Verify session-expired event was dispatched
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'session-expired',
        })
      );
    });

    it('should handle 401 response for different reasons', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Invalid credentials' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await expect(apiClient.get(userId, '/test-endpoint')).rejects.toThrow(
        'Your authentication token has expired. Please sign in again.'
      );

      // Verify token was cleared
      expect(TokenStorage.getAccessToken()).toBeNull();
    });
  });

  describe('Different HTTP Methods', () => {
    it('should inject JWT header for POST requests', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.post(userId, '/test-post', { test: 'data' });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Authorization', `Bearer ${token}`);
    });

    it('should inject JWT header for PUT requests', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.put(userId, '/test-put', { test: 'data' });

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Authorization', `Bearer ${token}`);
    });

    it('should inject JWT header for DELETE requests', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.delete(userId, '/test-delete');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Authorization', `Bearer ${token}`);
    });

    it('should inject JWT header for HEAD requests', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        headers: new Map([['ETag', 'test-etag']]),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.head(userId, '/test-head');

      const callArgs = mockFetch.mock.calls[0][1];
      expect(callArgs.headers).toHaveProperty('Authorization', `Bearer ${token}`);
    });
  });

  describe('URL Construction with JWT', () => {
    it('should construct correct URL with user_id path parameter', () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      // Test various path formats
      await apiClient.get('user-123', '/tasks');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/user-123/tasks',
        expect.any(Object)
      );
    });

    it('should handle paths without leading slash', async () => {
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');
      const token = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(token);

      const mockResponse = {
        ok: true,
        json: async () => ({ data: 'success' }),
        headers: new Map(),
      };

      mockFetch.mockResolvedValueOnce(mockResponse);

      await apiClient.get('user-123', 'tasks'); // No leading slash

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/user-123/tasks',
        expect.any(Object)
      );
    });
  });
});