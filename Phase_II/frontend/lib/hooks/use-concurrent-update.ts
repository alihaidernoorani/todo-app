"use client";

import { useEffect, useRef, useState } from "react";

interface UseConcurrentUpdateOptions {
  pollInterval?: number; // milliseconds
  onUpdate?: (etag: string) => void;
  enabled?: boolean;
}

interface ConcurrentUpdateState {
  hasUpdate: boolean;
  latestEtag: string | null;
  isPolling: boolean;
}

/**
 * Hook to detect concurrent updates using ETag-based polling
 * Pauses polling when tab is hidden using Page Visibility API
 *
 * @param resourceUrl - The URL to poll for updates
 * @param currentEtag - The current ETag value for comparison
 * @param options - Configuration options
 * @returns State indicating if concurrent updates were detected
 */
export function useConcurrentUpdate(
  resourceUrl: string | null,
  currentEtag: string | null,
  options: UseConcurrentUpdateOptions = {}
): ConcurrentUpdateState {
  const {
    pollInterval = 30000, // 30 seconds default
    onUpdate,
    enabled = true,
  } = options;

  const [state, setState] = useState<ConcurrentUpdateState>({
    hasUpdate: false,
    latestEtag: null,
    isPolling: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);

  // Check for concurrent updates
  const checkForUpdates = async () => {
    if (!resourceUrl || !currentEtag || !enabled) return;

    try {
      setState((prev) => ({ ...prev, isPolling: true }));

      // HEAD request to get latest ETag without downloading full response
      const response = await fetch(resourceUrl, {
        method: "HEAD",
        credentials: "include", // Include cookies for auth
      });

      const latestEtag = response.headers.get("ETag");

      if (latestEtag && latestEtag !== currentEtag) {
        setState({
          hasUpdate: true,
          latestEtag,
          isPolling: false,
        });

        if (onUpdate) {
          onUpdate(latestEtag);
        }
      } else {
        setState((prev) => ({ ...prev, isPolling: false }));
      }
    } catch (error) {
      console.error("Error checking for concurrent updates:", error);
      setState((prev) => ({ ...prev, isPolling: false }));
    }
  };

  // Handle Page Visibility API to pause polling when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";

      if (isVisibleRef.current) {
        // Resume polling when tab becomes visible
        checkForUpdates();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [resourceUrl, currentEtag, enabled]);

  // Set up polling interval
  useEffect(() => {
    if (!resourceUrl || !currentEtag || !enabled) {
      // Clear existing interval if disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial check
    checkForUpdates();

    // Set up interval for subsequent checks (only when tab is visible)
    intervalRef.current = setInterval(() => {
      if (isVisibleRef.current) {
        checkForUpdates();
      }
    }, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [resourceUrl, currentEtag, pollInterval, enabled]);

  return state;
}

/**
 * Reset the concurrent update state (e.g., after user acknowledges the update)
 */
export function useResetConcurrentUpdate(): (setState: React.Dispatch<React.SetStateAction<ConcurrentUpdateState>>) => void {
  return (setState) => {
    setState({
      hasUpdate: false,
      latestEtag: null,
      isPolling: false,
    });
  };
}
