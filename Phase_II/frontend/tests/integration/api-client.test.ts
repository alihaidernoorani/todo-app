/**
 * Integration Tests for ApiClient
 *
 * Tests JWT injection, error handling, and ETag support
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ApiClient } from "@/lib/api/client";

// Mock fetch globally
global.fetch = vi.fn();

describe("ApiClient", () => {
  let apiClient: ApiClient;
  const mockUserId = "user-123";
  const mockBaseURL = "http://localhost:8000";

  beforeEach(() => {
    vi.clearAllMocks();
    // Set environment variable
    process.env.NEXT_PUBLIC_API_URL = mockBaseURL;
    apiClient = new ApiClient();
  });

  describe("URL Construction", () => {
    it("should build correct URL with user_id path interpolation", async () => {
      const mockResponse = { data: { message: "success" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.get(mockUserId, "/tasks");

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/${mockUserId}/tasks`,
        expect.objectContaining({
          method: "GET",
          credentials: "include",
        })
      );
    });

    it("should handle paths with and without leading slash", async () => {
      const mockResponse = { data: { message: "success" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.get(mockUserId, "tasks");

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockBaseURL}/api/${mockUserId}/tasks`,
        expect.any(Object)
      );
    });

    it("should remove trailing slash from base URL", () => {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000/";
      const client = new ApiClient();

      expect((client as any).baseURL).toBe("http://localhost:8000");
    });
  });

  describe("JWT and Credentials", () => {
    it("should include credentials in all requests", async () => {
      const mockResponse = { data: { message: "success" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.get(mockUserId, "/tasks");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          credentials: "include", // Include HttpOnly cookies
        })
      );
    });

    it("should set Content-Type header for POST requests with body", async () => {
      const mockResponse = { data: { id: "123" } };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: new Headers(),
      });

      await apiClient.post(mockUserId, "/tasks", { title: "Test" });

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Error Handling", () => {
    it("should handle 401 Unauthorized and dispatch session-expired event", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      const eventListener = vi.fn();
      window.addEventListener("session-expired", eventListener);

      await expect(apiClient.get(mockUserId, "/tasks")).rejects.toThrow(
        "Session expired. Please sign in again."
      );

      expect(eventListener).toHaveBeenCalled();

      window.removeEventListener("session-expired", eventListener);
    });

    it("should handle 403 Forbidden with access denied message", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({}),
      });

      await expect(apiClient.get(mockUserId, "/tasks")).rejects.toThrow(
        "Access denied. You do not have permission to access this resource."
      );
    });

    it("should handle 412 Precondition Failed for ETag mismatches", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 412,
        json: async () => ({}),
      });

      await expect(apiClient.get(mockUserId, "/tasks")).rejects.toThrow(
        "The resource has been modified by another user. Please refresh and try again."
      );
    });

    it("should parse error details from response body", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ detail: "Invalid input" }),
      });

      await expect(apiClient.get(mockUserId, "/tasks")).rejects.toThrow("Invalid input");
    });

    it("should handle network errors gracefully", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      await expect(apiClient.get(mockUserId, "/tasks")).rejects.toThrow("Network error");
    });
  });

  describe("ETag Support", () => {
    it("should extract ETag header from response when includeEtag=true", async () => {
      const mockEtag = '"abc123"';
      const headers = new Headers();
      headers.set("ETag", mockEtag);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
        headers,
      });

      const response = await apiClient.get(mockUserId, "/tasks", true);

      expect(response).toEqual({
        data: { id: "123" },
        etag: mockEtag,
      });
    });

    it("should send If-Match header for conditional PUT requests", async () => {
      const mockEtag = '"abc123"';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
        headers: new Headers(),
      });

      await apiClient.put(mockUserId, "/tasks/123", { title: "Updated" }, mockEtag);

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers.get("If-Match")).toBe(mockEtag);
    });

    it("should send If-None-Match header for conditional GET requests", async () => {
      const mockEtag = '"abc123"';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "123" }),
        headers: new Headers(),
      });

      await apiClient.getWithEtag(mockUserId, "/tasks/123", mockEtag);

      const callArgs = (global.fetch as any).mock.calls[0];
      const headers = callArgs[1].headers;

      expect(headers.get("If-None-Match")).toBe(mockEtag);
    });

    it("should perform HEAD request without body", async () => {
      const mockEtag = '"abc123"';
      const headers = new Headers();
      headers.set("ETag", mockEtag);

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        headers,
      });

      const response = await apiClient.head(mockUserId, "/tasks/123");

      expect(response).toEqual({
        etag: mockEtag,
        lastModified: undefined,
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "HEAD",
        })
      );
    });
  });

  describe("HTTP Methods", () => {
    it("should make GET request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] }),
        headers: new Headers(),
      });

      await apiClient.get(mockUserId, "/tasks");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should make POST request with body", async () => {
      const mockBody = { title: "New Task" };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "123" } }),
        headers: new Headers(),
      });

      await apiClient.post(mockUserId, "/tasks", mockBody);

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[1].method).toBe("POST");
      expect(callArgs[1].body).toBe(JSON.stringify(mockBody));
    });

    it("should make PUT request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "123" } }),
        headers: new Headers(),
      });

      await apiClient.put(mockUserId, "/tasks/123", { title: "Updated" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PUT" })
      );
    });

    it("should make PATCH request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: "123" } }),
        headers: new Headers(),
      });

      await apiClient.patch(mockUserId, "/tasks/123", { completed: true });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "PATCH" })
      );
    });

    it("should make DELETE request", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true } }),
        headers: new Headers(),
      });

      await apiClient.delete(mockUserId, "/tasks/123");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });
});
