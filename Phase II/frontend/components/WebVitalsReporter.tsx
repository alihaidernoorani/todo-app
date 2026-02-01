"use client";

import { useEffect } from "react";
import { initWebVitals } from "@/lib/utils/web-vitals";

/**
 * Web Vitals Reporter Component
 *
 * Client component that initializes Web Vitals tracking on mount.
 * Should be included once in the root layout.
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    initWebVitals({
      debug: process.env.NODE_ENV === "development",
      // Optional: Send to analytics endpoint
      // analyticsEndpoint: process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT,
      onMetric: (_metric) => {
        // Optional: Custom handling (e.g., store in state, trigger alerts)
        // For production, you might want to batch metrics and send to analytics
        if (process.env.NODE_ENV === "production") {
          // Send to your analytics service
          // Example: window.gtag?.('event', _metric.name, { value: _metric.value });
        }
      },
    });
  }, []);

  // This component doesn't render anything
  return null;
}
