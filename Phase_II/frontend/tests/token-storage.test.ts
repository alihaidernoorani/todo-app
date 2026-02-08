/**
 * Token Storage Tests
 *
 * Test suite for the TokenStorage class functionality including:
 * - Setting and getting tokens
 * - Clearing tokens
 * - Checking token expiration
 * - Decoding token payload
 */

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

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('setAccessToken', () => {
    it('should store the token in localStorage', () => {
      const token = 'test-jwt-token';
      TokenStorage.setAccessToken(token);

      expect(localStorage.getItem('better-auth-access-token')).toBe(token);
    });

    it('should overwrite existing token', () => {
      TokenStorage.setAccessToken('first-token');
      TokenStorage.setAccessToken('second-token');

      expect(localStorage.getItem('better-auth-access-token')).toBe('second-token');
    });

    it('should handle empty token', () => {
      TokenStorage.setAccessToken('');

      expect(localStorage.getItem('better-auth-access-token')).toBe('');
    });
  });

  describe('getAccessToken', () => {
    it('should return the token from localStorage', () => {
      localStorage.setItem('better-auth-access-token', 'test-jwt-token');

      expect(TokenStorage.getAccessToken()).toBe('test-jwt-token');
    });

    it('should return null when no token exists', () => {
      expect(TokenStorage.getAccessToken()).toBeNull();
    });

    it('should return empty string when token is empty', () => {
      localStorage.setItem('better-auth-access-token', '');

      expect(TokenStorage.getAccessToken()).toBe('');
    });
  });

  describe('clearAccessToken', () => {
    it('should remove the token from localStorage', () => {
      localStorage.setItem('better-auth-access-token', 'test-jwt-token');
      TokenStorage.clearAccessToken();

      expect(localStorage.getItem('better-auth-access-token')).toBeNull();
    });

    it('should not error when no token exists', () => {
      expect(() => TokenStorage.clearAccessToken()).not.toThrow();
    });
  });

  describe('isExpired', () => {
    it('should return true for expired token', () => {
      // Create a token that expires 1 hour ago
      const expiredPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(expiredPayload));
      const signature = btoa('fake-signature');

      const expiredToken = `${header}.${payload}.${signature}`;

      localStorage.setItem('better-auth-access-token', expiredToken);

      expect(TokenStorage.isExpired()).toBe(true);
    });

    it('should return false for valid token', () => {
      // Create a token that expires in 1 hour
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000),
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');

      const validToken = `${header}.${payload}.${signature}`;

      localStorage.setItem('better-auth-access-token', validToken);

      expect(TokenStorage.isExpired()).toBe(false);
    });

    it('should return true when no token exists', () => {
      expect(TokenStorage.isExpired()).toBe(true);
    });

    it('should return true for token without exp claim', () => {
      // Create a token without expiration
      const noExpPayload = {
        sub: 'test-user',
        // Missing exp claim
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(noExpPayload));
      const signature = btoa('fake-signature');

      const noExpToken = `${header}.${payload}.${signature}`;

      localStorage.setItem('better-auth-access-token', noExpToken);

      expect(TokenStorage.isExpired()).toBe(true);
    });

    it('should return true for malformed token', () => {
      localStorage.setItem('better-auth-access-token', 'invalid.token.format');

      expect(TokenStorage.isExpired()).toBe(true);
    });

    it('should return true for token with invalid exp claim', () => {
      // Create a token with invalid exp (not a number)
      const invalidExpPayload = {
        sub: 'test-user',
        exp: 'not-a-number', // Invalid exp
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(invalidExpPayload));
      const signature = btoa('fake-signature');

      const invalidToken = `${header}.${payload}.${signature}`;

      localStorage.setItem('better-auth-access-token', invalidToken);

      expect(TokenStorage.isExpired()).toBe(true);
    });
  });

  describe('decode', () => {
    it('should decode a valid JWT token', () => {
      const expectedPayload = {
        sub: 'test-user',
        email: 'user@example.com',
        name: 'Test User',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        iss: 'https://test-better-auth.com',
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(expectedPayload));
      const signature = btoa('fake-signature');

      const token = `${header}.${payload}.${signature}`;

      const decoded = TokenStorage.decode(token);

      expect(decoded).toEqual(expectedPayload);
    });

    it('should return null for invalid token format', () => {
      const result = TokenStorage.decode('invalid.token.format');

      expect(result).toBeNull();
    });

    it('should return null for token with invalid base64 payload', () => {
      const token = 'header.invalid-base64-footer';

      const result = TokenStorage.decode(token);

      expect(result).toBeNull();
    });

    it('should return null for token with non-JSON payload', () => {
      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = 'not-json';
      const signature = btoa('fake-signature');

      const token = `${header}.${payload}.${signature}`;

      const result = TokenStorage.decode(token);

      expect(result).toBeNull();
    });

    it('should return null when token is empty', () => {
      const result = TokenStorage.decode('');

      expect(result).toBeNull();
    });

    it('should return null for token with only two parts', () => {
      const token = 'header.payload';

      const result = TokenStorage.decode(token);

      expect(result).toBeNull();
    });

    it('should return null for token with four parts', () => {
      const token = 'header.payload.signature.extra';

      const result = TokenStorage.decode(token);

      expect(result).toBeNull();
    });
  });

  describe('integration', () => {
    it('should set and get token correctly', () => {
      const token = 'test-integration-token';

      TokenStorage.setAccessToken(token);
      const retrieved = TokenStorage.getAccessToken();

      expect(retrieved).toBe(token);
    });

    it('should set and check expiration correctly', () => {
      // Create a token that expires in 1 hour
      const validPayload = {
        sub: 'test-user',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify(validPayload));
      const signature = btoa('fake-signature');

      const validToken = `${header}.${payload}.${signature}`;

      TokenStorage.setAccessToken(validToken);
      const isExpired = TokenStorage.isExpired();

      expect(isExpired).toBe(false);
    });

    it('should clear token and affect other methods', () => {
      const token = 'test-clear-token';
      TokenStorage.setAccessToken(token);

      expect(TokenStorage.getAccessToken()).toBe(token);

      TokenStorage.clearAccessToken();

      expect(TokenStorage.getAccessToken()).toBeNull();
      expect(TokenStorage.isExpired()).toBe(true);
    });
  });
});